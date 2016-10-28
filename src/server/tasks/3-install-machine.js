var util    = require('util')
  , debug   = require('debug')('deployer-3-install-machine')
  , Q       = require('q')
  , _       = require('underscore')
  , request = require('request')
  , Task    = require('./task')
  , machineSvc = require('../services/machine-service')
  , configSvc  = require('../services/config-service')
  , regionSvc  = require('../services/region-service')
  , envSvc     = require('../services/env-service')
  , sysConfig  = require('../../../config')
  , RingtailClient = require('ringtail-deploy-client')
  ;


function TaskImpl(options) {
  this.name = 'Install Ringtail';
  this.pollInterval = 15000;
  this.installInterval = 60000;
  Task.call(this, options);

  this.validators.required.push('branch');
  this.serviceClient = null;  // used by unit test to capture the client

  this.execute = async function execute(scope, log) {

    var options         = scope.options
      , machineId       = this.machineId
      , configId        = this.configId
      , pollInterval    = this.pollInterval
      , installInterval = this.installInterval
      , branch          = this.getData(scope, 'branch')
      , me = this
      ;

    log('starting deployment');

    // Load the machine
    debug('loading machine ' + machineId);
    let machine = await machineSvc.get(machineId);
    let serviceIP = machine.intIP;

    // load the config for the machine
    debug('loading config ' + configId);
    let config = await configSvc.get(configId);

    let regionId = await envSvc.findRegionByEnvId(config.envId);

    let region = await regionSvc.findById(regionId);

    let timeout = (region && region.serviceConfg && region.serviceConfg.timeout) || sysConfig.serviceTimeout || 70000;
    // Create the Ringtail Install Service client
    let client = me.serviceClient = new RingtailClient({ serviceHost: serviceIP, timeout:timeout });
    //log('will use: %s', client.installUrl);
    //log('will use: %s', client.statusUrl);
    //log('will use: %s', client.updateUrl);
    //log('will use: %s', client.configUrl);
    //log('will use: %s', client.installedUrl);

    // wait for the service to be available
    log('waiting until the service is responsive ' + client.statusUrl);
    await client.waitForService();

    // upgrade install service
    log('updating install service to latest version');
    await client.update();

    // wait for service to return
    log('waiting for the service update to complete');
    await client.waitForService();

    // configure install service
    debug('configuring install service' + machineId);
    let configs = {
      'Common|BRANCH_NAME' : branch,
      'RoleResolver|ROLE' : config.roles[0],
      'JobLogger|ENV_NAME': machine.machineName,
      'JobLogger|JOB_ID': me.jobId
    };

    //kind of a bit hacky, but handles quoting to server
    let error = '';    
    let configData = config.data;
    let configKeys = Object.keys(configData);
    configKeys.forEach(function(key){
      let tempkey = configData[key] || '';
      //uninstall exclusions should not be escape quoted
      if(tempkey && tempkey.replace && key.indexOf('UNINSTALL_EXCLUSIONS') < 0) {
        tempkey = tempkey.replace(/\"/g, '').trim();
        if(tempkey.indexOf(' ') > 0) {
          configData[key] = '"""' + tempkey + '"""';
        }
      }
    });
    _.extend(configs, configData);

    if(config.launchKey) {
      _.extend(configs, config.launchKey);
    }
    _.extend(configs, getConfigsFromOptions(options));

    debug('sending config object ' + machineId);
    await client.setConfigs(configs);

    //start installation
    log('starting installation');
    await client.install();

    // wait for installation to complete
    log('waiting for install to complete, refer to Run Details');
    let retry = false;
    try {
      await client.waitForInstall(function(status) {
        me.rundetails = status;
        retry = isTaskEnded(me.rundetails);
      });
    } catch(err) {
      error = err;
    }

    // retry loop on failure.
    let maxRetry = sysConfig.retryMax == null ? 0 : sysConfig.retryMax;
    let currentRetry = 1;
    if(retry === true) {
      while(retry && currentRetry <= maxRetry) {

        log('there was a task failure that requested a retry.  retrying from that step onwards.  ' + currentRetry + ' of ' + maxRetry);
        await client.retry();

        try {
          await client.waitForInstall(function(status) {
            me.rundetails = status;
            retry = isTaskEnded(me.rundetails);
          });
        } catch(err) {
          error = err;
        }
        
        currentRetry++;        
      }

      if(retry && currentRetry >= maxRetry) {
        if(!(me.rundetails.indexOf('UPGRADE SUCCESSFUL') >= 0)) {
          log('out of retry attempts on this machine.  You can resume later this way: %s', client.retryUrl);
          throw error;
        }
      }
    }

    if(isTaskWarning(me.rundetails)) {
      let messages = extractLogInfoOnWarning(me.rundetails);
      _.each(messages, function(message) {
        log(message);
      });
      me.Warning = 'Warning';
    }

    //if no retries and there's an error
    if(error) {    
      log(error);   
      throw error;
    }

    // update machine install notes
    debug('retrieving install info for ' + serviceIP);
    machine.installNotes = await client.installed();
    await machineSvc.update(machine);

    // signal completion for installation
    log('installation complete');
  };

  function extractLogInfoOnWarning(rundetails) {
    let runDetailSplit = rundetails.split('<p>');
    let messages = [];
    _.each(runDetailSplit, function(partialRunDetail) {
      let idx = partialRunDetail.indexOf('UPGRADE WARNING');
      if(idx >= 0) {
        let split = partialRunDetail.split('</p>')[0];
        if(split.length > 0) {
          messages.push(split);
        }
      }
    });

    debug('exiting extractLogInfoOnWarning');
    return messages;
  }

  function isTaskEnded(rundetails) {
    let failed = rundetails.indexOf('UPGRADE FAILED') >= 0,
      successful = rundetails.indexOf('UPGRADE SUCCESSFUL') >= 0,
      retry = rundetails.indexOf('UPGRADE RETRY') >= 0;

    return (retry || failed) && !successful;
  }

  function isTaskWarning(rundetails) {
    let warn = rundetails ? rundetails.indexOf('UPGRADE WARNING') >= 0 : false;

    return warn;
  }

  /**
   * Converts UI logic into additional options
   * Could be refactred into client as a method call
   * to help configure the service
   */
  function getConfigsFromOptions(opts) {
    var result = {};
    if(opts) {
      if(opts.wipeRpfWorkers) {
        result['Common|FILE_DELETIONS'] = 'C:\\Program Files\\FTI Technology\\Ringtail Processing Framework\\RPF_Supervisor';
      } else {
        result['Common|FILE_DELETIONS'] = '';
      }
    }
    return result;
  }  
}



util.inherits(TaskImpl, Task);

module.exports = TaskImpl;