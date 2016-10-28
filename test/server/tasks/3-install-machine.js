var mocha   = require('mocha')
  , sinon   = require('sinon')
  , chai    = require('chai')
  , expect  = chai.expect
  , Q               = require('q')
  , RingtailClient  = require('ringtail-deploy-client')
  , Env         = require('../../../src/server/models/env')
  , Machine     = require('../../../src/server/models/machine')
  , Task        = require('../../../src/server/tasks/3-install-machine')
  , machineSvc  = require('../../../src/server/services/machine-service')
  , configSvc   = require('../../../src/server/services/config-service')
  , envSvc      = require('../../../src/server/services/env-service')
  , regionSvc      = require('../../../src/server/services/region-service')
  ;

describe('3-install-machine', function() {

  describe('#execute', function() {
    var task
      , options
      , log
      , scope
      , env
      , machine
      , config
      , region
      , stubGetMachine
      , stubGetConfig
      , stubWaitForService
      , stubUpdate
      , stubSetConfigs
      , stubInstall
      , stubWaitForInstall
      , stubInstalled
      ;

    options = {
      'machineId': 1,
      'configId': 12,
      data: {
        'branch': 'scope.me.deployedBranch'
      }
    };
    task = new Task(options);
    task.pollInterval = 0;
    task.installInterval = 0;
    env = new Env({ deployedBranch: 'NEW_BRANCH' });
    scope = {
      'me': env
    };
    machine = {
      role: 'SKYTAP-WEB',
      intIP: '192.168.0.2'
    };
    config = {
      configId: 1,
      configName: 'test',
      data: {
        'RingtailConfigurator|CONFIGURATORPORT': 10000,
        'RingtailConfigurator|HOST': 'localhost'
      },
      roles: ['AGENT']
    };

    region = {
      regionId: "10",
      serviceConfig: {},
      browseConfig: {}
    }

    function returnInstalled() {
      /* jshint es5:false */
      /* jshint ignore:start */
      return Q([ 'one', 'two' ]);
      /* jshint ignore:end */
    }

   
    

    beforeEach(function() {
      log = sinon.spy();

      sinon.stub(regionSvc, 'findById').returns(new Q(region));    
      sinon.stub(envSvc, 'findRegionByEnvId').returns(new Q(region));   
      
      stubGetMachine      = sinon.stub(machineSvc, 'get').returns(new Q(machine));
      stubGetConfig       = sinon.stub(configSvc, 'get').returns(new Q(config));
      stubWaitForService  = sinon.stub(RingtailClient.prototype, 'waitForService');
      stubUpdate          = sinon.stub(RingtailClient.prototype, 'update');
      stubSetConfigs      = sinon.stub(RingtailClient.prototype, 'setConfigs');
      stubInstall         = sinon.stub(RingtailClient.prototype, 'install');
      stubWaitForInstall  = sinon.stub(RingtailClient.prototype, 'waitForInstall');
      stubInstalled       = sinon.stub(RingtailClient.prototype, 'installed', returnInstalled);  

      sinon.stub(machineSvc, 'update');
    });

    afterEach(function() {
      machineSvc.get.restore();
      configSvc.get.restore();
      stubWaitForService.restore();
      stubUpdate.restore();
      stubSetConfigs.restore();
      stubInstall.restore();
      stubWaitForInstall.restore();
      stubInstalled.restore();
      machineSvc.update.restore();
      envSvc.findRegionByEnvId.restore();
      regionSvc.findById.restore();
      
    });

    it('loads the machine', function(done) {
      task
        .execute(scope, log)
        .then(() => expect(stubGetMachine.calledOnce).to.be.true)
        .then(() => done())
        .catch(done);
    });

    it('loads the config', function(done) {
      task
        .execute(scope, log)
        .then(() => expect(stubGetConfig.calledOnce).to.be.true)
        .then(() => done())
        .catch(done);
    });

    it('service client uses correct machine host', function(done) {
      task
        .execute(scope, log)
        .then(() => expect(task.serviceClient.serviceHost).to.equal(machine.intIP))
        .then(() => done())
        .catch(done);
    });

    it('waits for the installer service', function(done) {
      task
        .execute(scope, log)
        .then(() => expect(stubWaitForService.callCount).to.equal(2))
        .then(() => done())
        .catch(done);
    });

    it('triggers an update of the install service', function(done) {
      task
        .execute(scope, log)
        .then(function() {
          expect(stubInstall.called).to.be.true;
          expect(stubWaitForInstall.calledOnce).to.be.true;
        })
        .then(() => done())
        .catch(done);
    });

    it('configures the service configs', function(done) {
      task
        .execute(scope, log)
        .then(function() {
          var args = stubSetConfigs.getCall(0).args[0];
          for (var key in config.data) {
            if(true)
              expect(args[key]).to.equal(config.data[key]);
          }
        })
        .then(() => done())
        .catch(done);
    });

    it('configures the branch name', function(done) {
      task
        .execute(scope, log)
        .then(function() {
          var args = stubSetConfigs.getCall(0).args[0];
          expect(args['Common|BRANCH_NAME']).to.equal('NEW_BRANCH');
        })
        .then(() => done())
        .catch(done);
    });

    it('starts the installation', function(done) {
      task
        .execute(scope, log)
        .then(() => expect(stubInstall.calledOnce).to.be.true)
        .then(() => done())
        .catch(done);
    });

    it('waits for installation to complete', function(done) {
      task
        .execute(scope, log)
        .then(() => expect(stubWaitForInstall.calledOnce).to.be.true)
        .then(() => done())
        .catch(done);
    });

    it('updates the machine installNotes', function(done) {
      task
        .execute(scope, log)
        .then(() => expect(stubInstalled.calledOnce).to.be.true)
        .then(() => done())
        .catch(done);
    });

    it('sets the install notes for the machine', function(done) {
      task
        .execute(scope, log)
        .then(() => {
          expect(machine.installNotes.length).to.equal(2);
          expect(machine.installNotes[0]).to.equal('one');
          expect(machine.installNotes[1]).to.equal('two');
        })
        .then(() => done())
        .catch(done);
    });

    it('saves the machine info', function(done) {
      task
        .execute(scope, log)
        .then(() => expect(machineSvc.update.calledOnce).to.be.true)
        .then(() => done())
        .catch(done);
    });

    describe('when .wipeRpfWorkers option is false', function() {
      beforeEach(function() {
        scope.options = { wipeRpfWorkers: false };
      });
      it('unsets the FILE_DELETIONS config', function(done) {
        task
          .execute(scope, log)
          .then(() => expect(stubSetConfigs.getCall(0).args[0]['Common|FILE_DELETIONS']).to.equal(''))
          .then(() => done())
          .catch(done);

      });
    });

  });

});