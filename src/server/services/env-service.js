let debug           = require('debug')('deployer-envservice')
  , Q               = require('q')
  , Skytap          = require('node-skytap')
  , EnvMapper       = require('../mappers/env-mapper')
  , JobMapper       = require('../mappers/jobs-mapper') 
  , MachineMapper   = require('../mappers/machine-mapper')
  , Env             = require('../models/env')
  , config          = require('../../../config')
  , dbPath          = __dirname + '/../../../data/deployer.db'
  , machineService  = require('./machine-service')
  , skytap          = Skytap.init(config.skytap)
  , envMapper       = new EnvMapper(dbPath)
  , jobMapper       = new JobMapper(dbPath)
  , machineMapper   = new MachineMapper(dbPath)
  , RingtailClient  = require('ringtail-deploy-client')
  , ConfigMapper    = require('../mappers/config-mapper')
  , configMapper    = new ConfigMapper(dbPath)  
  , _               = require('underscore')
  , async           = require('async')
  , findById
  ;

/**
 * Gets the list of environments
 *
 * @api public
 * @param {Object} paging
 * @param {Function} next
 * @return {Promise} resolves to Array[Env]
 */
exports.findAll = function list(paging, next) {
  paging = paging || {};
  paging.pagesize = paging.pagesize || 25;
  paging.page = paging.page || 1;

  return envMapper.findAll(paging)
    .then(joinEnvsMachines)
    .then(joinEnvsSkytap)
    .nodeify(next);
};


exports.findByRegion = function findByRegion(regionId, paging, next) {
  let total;

  paging = paging || {};
  paging.pagesize = paging.pagesize || 25;
  paging.page = paging.page || 1;


  return Q.all([
      envMapper.findByRegionCount(regionId),
      envMapper.findByRegion(regionId, paging)
    ])
    .then(function(results) {
      total = results[0]; // count
      return results[1];  // array[env]
    })
    .then(joinEnvsMachines)
    .then(joinEnvsSkytap)
    .then(function(envs) {
      envs.total    = total;
      envs.page     = paging.page;
      envs.pagesize = paging.pagesize;
      return envs;
    })
    .nodeify(next);
};

exports.findById = findById = function get(envId, next) {
  return envMapper.findById(envId)
    .then(joinEnvMachines)
    .then(joinEnvSkytap)
    .nodeify(next);
};

exports.findRegionByEnvId = function findRegionByEnvId(envId, next) {
  return envMapper.findRegionByEnvId(envId)
    .nodeify(next);
};

exports.version = function version(envId, next) {
  let serviceip;

  machineMapper
    .findByEnv(envId)
    .then(function(machines) {
      async.eachSeries(machines, function(machine, callback){
        configMapper
            .findById(machine.configId)
            .then(function(conf){
              let roles = conf.roles;
              let possibleRoles = ['SKYTAP-ALLINONE', 'WEBAGENT', 'DEV-FULL', 'WEB', 'SKYTAP-WEB'];
              let matchingRole = _.intersection(roles, possibleRoles);
             
              if(matchingRole.length > 0) {
                if(!serviceip)  serviceip = machine.intIP;
                return callback(null, serviceip);
              } else {
                return callback(null, null);
              }
          });
      }, function done(){
        let client = new RingtailClient({ serviceHost: serviceip });
        let version;

        client
          .installed()
          .then(function(result){
            if(result && result.length > 0) {
              result.forEach(function(row){
                let versionMatches = row.match(/Ringtail Version: ([0-9\.].*)/i);
                if(versionMatches && !version) {
                  version = versionMatches[1];
                }
              });
            }
            return {
              version: version || '0.0.0.0'
            };
          }).fail(function(err) {
            
          })
          .nodeify(next);
      });
    });
};

exports.create = function create(data, next) {
  let env = new Env(data);
  env.envName = '';

  return env
    .validate()
    .then(function() {
      return envMapper
        .insert(env)
        .then(function(result) {
          env.envId = result.lastID;
          return env;
        });
    })
    .then(joinEnvSkytap)
    .nodeify(next);
};

exports.update = function update(data, next) {
  debug('update environment');
  let env = new Env(data);

  return env.validate()
    .then(function() { return envMapper.update(env); })
    .then(function() {
      return findById(env.envId)
        .then(function(found) {
          return machineService
            .sync(env.envId, found.machines, env.machines);
        })
        .then(function(machines) {
          env.machines = machines;
          return env;
        });
    })
    .then(joinEnvMachines)
    .then(joinEnvSkytap)
    .nodeify(next);
};

exports.log = function log(job, next) {
  let data = {
    jobId: job.id,
    log: JSON.stringify(job)
  };

  return jobMapper.insert(data).nodeify(next);
};

exports.remove = function remove(envId, next) {
  debug('removing environemnt ' + envId);
  return envMapper
    .remove(envId)
    .nodeify(next);
};

exports.start = function start(data, suspendOnIdle, next) {
  let env = new Env(data)
    , opts;

  opts = {
    configuration_id: env.remoteId,
    suspend_on_idle: suspendOnIdle,
    runstate: 'running'
  };

  return skytap.environments.update(opts)
    .then(function() { return envMapper.update(env); })
    .then(function(result) { return env; })
    .then(joinEnvMachines)
    .then(joinEnvSkytap)
    .nodeify(next);
};


exports.pause = function pause(data, next) {
  let env = new Env(data)
    , opts;

  opts = {
    configuration_id: env.remoteId,
    runstate: 'suspended'
  };

  return skytap.environments.update(opts)
    .then(function() { return env; })
    .then(joinEnvMachines)
    .then(joinEnvSkytap)
    .nodeify(next);
};


exports.reset = function reset(envId, next) {
  let env;

  return envMapper.findById(envId)
    .then(function(found) {
      env = found;
      env.status = 'deployed';
    })
    .then(function() {
      return envMapper.update(env)
        .then(function() {
          return env;
        });
    })
    .then(joinEnvMachines)
    .then(joinEnvSkytap)
    .nodeify(next);
};

/**
 * Helper function to join machines for the list of envs
 *
 * @api private
 * @param {Array} envs
 */
function joinEnvsMachines(envs) {
  let promises = envs.map(joinEnvMachines);
  return Q.all(promises);
}

/**
 * Helper function to join machines for an env
 *
 * @api private
 * @param {Env} env
 */
function joinEnvMachines(env) {
  return machineMapper.findByEnv(env.envId)
    .then(function(machines) {
      env.machines = machines;
      return env;
    });
}

/**
 * Helper function to join skytap data for a list of envs
 *
 * @api private
 * @param {Array[Env]} envs
 */
function joinEnvsSkytap(envs) {
  let promises = envs.map(joinEnvSkytap);
  return Q.all(promises);
}

/**
 * Helper function to join skytap data for a list of envs
 *
 * @api private
 * @param {Env} env
 */
function joinEnvSkytap(env) {
  if(env.remoteType === 'skytap' && env.remoteId) {
    return skytap.environments.get({ configuration_id: env.remoteId, keep_idle: true })
      .then(function(skyenv) {
        env.runstate = skyenv.runstate;
        return env;
      }, function() {
        debug('Could not find env %d', env.remoteId);
        return env;
      });
  } else {
    return env;
  }
}