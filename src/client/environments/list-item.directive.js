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
      templateUrl: '/app/environments/list-item.directive.html',
      controller: ListItemController,
      controllerAs: 'vm',
      bindToController: true
    };
  }
  
  ListItemController.$inject = [ '$modal','$location', '$timeout', 'config', 'EnvironmentEditor', 'EnvironmentStarter' ];
  
  function ListItemController($modal, $location, $timeout, config, EnvironmentEditor, EnvironmentStarter) {
    var vm = this;
    vm.enableDeploy = config.enableDeployment;
    vm.environment  = this.environment; 
    vm.showStart    = false;
    vm.showPause    = false;
    vm.showBuildNotes = null;
    vm.status       = null;
    vm.show         = false;
    vm.edit         = edit;
    vm.pause        = pause;
    vm.redeploy     = redeploy;
    vm.reset        = reset;
    vm.start        = start;
    
    activate(vm.environment);
    
    //////////
    
    function activate(environment) {    
      var runstate      = environment.runstate;
      vm.environment    = environment;
      vm.showStart      = runstate === 'suspended' || runstate === 'stopped';
      vm.showPause      = runstate === 'running';
      vm.showButtons    = environment.status === 'deployed';
      vm.showDeployLink = environment.status === 'deploying';

      if(vm.showBuildNotes === null) {
        vm.showBuildNotes = false;
      }
      
      pollWhileBusy(environment);
    }

    function pollWhileBusy(environment) {
      if(environment.runstate === 'busy' || environment.status === 'deploying') {
        $timeout(function() {
          environment.$get(activate);
        }, 15000);
      }
    }

    function start() {
      EnvironmentStarter.open(vm.envirnoment);
    }

    function pause() {
      vm.environment.$pause(activate);
    }

    function redeploy() {
      var modal = $modal.open({
        templateUrl: '/app/environments/redeploy-dialog.html',
        controller: 'EnvironmentRedeployController',
        controllerAs: 'vm',
        resolve: {
          environment: function() {
            return vm.environment;
          }
        }
      });

      modal.result.then(function() {
        vm.environment.$redeploy()
        .then(function(environment) {
          var path = '/app/jobs/' + environment.deployedJobId;          
          $location.path(path);
        });     
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