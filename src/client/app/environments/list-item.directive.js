(function() {
  'use strict';
  
  angular
    .module('app.environments')
    .directive('listItem', listItem);
  
  function listItem() {
    return { 
      restrict: 'E',
      scope: {
        environment: '='
      },
      templateUrl: '/app/environments/list-item.html',
      controller: ListItemController,
      controllerAs: 'vm',
      bindToController: true
    };
  }
  
  ListItemController.$inject = [ '$timeout', '$scope', 'config', 'EnvironmentEditor', 'EnvironmentStarter', 'EnvironmentRedeploy' ];
  
  function ListItemController($timeout, $scope, config, EnvironmentEditor, EnvironmentStarter, EnvironmentRedeploy) {
    var vm = this;
    vm.enableDeploy   = config.enableDeployment;
    vm.environment    = this.environment;             
    vm.showBuildNotes = null;    
    vm.showStartStop  = showStartStop;
    vm.enableStart    = enableStart;
    vm.showRedeploy   = showRedeploy;
    vm.showCancel     = showCancel;
    vm.showDeployLink = showDeployLink;    
    vm.edit           = edit;
    vm.pause          = pause;
    vm.redeploy       = redeploy;
    vm.reset          = reset;
    vm.start          = start;
    vm.poll           = null;
    
    activate(vm.environment);
    
    //////////
    
    function activate(environment) {                
      vm.environment    = environment;      
      vm.deployStatus   = environment.status;
      vm.runStatus      = environment.runstate || 'running';

      if(vm.showBuildNotes === null) {
        vm.showBuildNotes = false;
      }
      
      pollWhileBusy(environment);

      // cancel polling on scope destroy
      $scope.$on('$destroy', function() {
        $timeout.cancel(vm.poll);
      });
    }

    function showStartStop() {
      // show buttons if
      // 1) it's a remote environment
      // 2) the environment is not currently deploying
      var environment = vm.environment;
      return !!environment.remoteType && environment.status !== 'deploying';
    }

    function enableStart() {
      var environment = vm.environment
        , runstate = environment.runstate;
      return environment.remoteType && runstate === 'suspended' || runstate === 'stopped';
    }

    function showRedeploy() {
      // show button if
      // 1) the environment is not currently deploying
      var environment = vm.environment;
      return environment.status !== 'deploying';
    } 

    function showCancel() {
      // show button if
      // 1) the environment is not currently deploying
      var environment = vm.environment;
      return environment.status === 'deploying';
    }

    function showDeployLink() {
     // show button if
      // 1) the environment is currently deploying
      // 2) the environment deployment failed
      var environment = vm.environment;
      return environment.status === 'deploying' || environment.status === 'failed';
    }

    function pollWhileBusy(environment) {
      if(environment.runstate === 'busy' || environment.status === 'deploying') {
        vm.poll = $timeout(function() {
          environment.$get(activate);
        }, 15000);
      }
    }

    function start() {
      EnvironmentStarter
        .open(vm.environment)
        .result
        .then(function() {
          pollWhileBusy(vm.environment);
        });
    }

    function pause() {
      vm.environment.$pause(activate);
      pollWhileBusy(vm.environment);
    }

    function redeploy() {
      EnvironmentRedeploy
        .open(vm.environment)
        .result
        .then(function() {
          pollWhileBusy(vm.environment);
        });

    }

    function reset() {
      vm.environment.$reset();
    }

    function edit() {
      EnvironmentEditor.open(vm.environment);
    }
  }
  
}());