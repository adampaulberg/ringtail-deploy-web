let debug         = require('debug')('deployer-machine-service')
  , Q             = require('q')
  , MachineMapper = require('../mappers/machine-mapper')
  , Machine       = require('../models/machine')
  , dbPath        = __dirname + '/../../../data/deployer.db'
  , RingtailClient  = require('ringtail-deploy-client')
  , machineMapper = new MachineMapper(dbPath)
  , create
  , update
  , del
  ;


exports.create = create = function create(data, next) {
  debug('creating machine %j', data);
  let machine = new Machine(data);

  return machine
    .validate()
    .then(function() {
      return machineMapper.insert(machine);
    })
    .then(function(result) {
      debug('machine %s created', result.lastID);
      machine.machineId = result.lastID;
      return machine;
    })
    .nodeify(next);
};

exports.update = update = function update(data, next) {
  debug('updating machine %s', data.machineId);
  let machine = new Machine(data);

  return machine
    .validate()
    .then(function() {
      return machineMapper.update(machine);
    })
    .then(function() {
      return machine;
    })
    .nodeify(next);
};

exports.get = function get(machineId, next) {
  debug('get machine %s', machineId);
  return machineMapper
    .findById(machineId)
    .nodeify(next);
};

exports.del = del = function del(machineId, next) {
  debug('deleting machine %s', machineId);
  return machineMapper
    .del(machineId)
    .nodeify(next);
};

exports.createMany = function createMany(envId, data, next) {
  let promises = [];

  if(data) {
    data.forEach(function(datum) {
      datum.envId = envId;
    });
    promises = data.map(function(datum) {
      return create(datum);
    });
  }

  return Q.all(promises);
};

exports.retry = function retry(machine, next) {
  let serviceIP = machine.intIP;
  let client = new RingtailClient({ serviceHost: serviceIP });

  return client.retry().nodeify();
}

exports.restart = function restart(machine, next) {
  let serviceIP = machine.intIP;
  let client = new RingtailClient({ serviceHost: serviceIP });

  return client.restart().nodeify();
}

exports.status = function status(machine, next) {
  let serviceIP = machine.intIP;
  let client = new RingtailClient({ serviceHost: serviceIP });
  
  return client.status().nodeify();
}

exports.sync = function sync(envId, oldMachines, newData, next) {
  debug('sync machines');
  let upserts = []
    , deletes = [];

  if(!newData) return [];

  newData.forEach(function(newData) {
    if(!newData.machineId) {
      newData.envId = envId;
      upserts.push(create(newData));
    } else {
      upserts.push(update(newData));
    }
  });

  oldMachines.forEach(function(oldData) {
    if(!filterById(newData, oldData.machineId)) {
      deletes.push(del(oldData.machineId));
    }
  });

  return Q
    .all(deletes)
    .then(function(){
      return Q
        .all(upserts)
        .then(function(machines) {
          return machines.sort(function(a, b) {
            return a.machineId > b.machineId;
          });
        });
    });

};

function filterById(machines, id) {
  return machines.filter(function(machine) {
    return machine.machineId === id;
  })[0];
}

