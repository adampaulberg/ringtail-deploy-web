(function() {
  'use strict';
  
  angular
    .module('app.environments.editor')
    .directive('envwizardConfig', envwizardConfig);
  
  function envwizardConfig() {
    return { 
      restrict: 'E',
      scope: {
        cancel: '=',
        create: '=',
        environment: '=',
        update: '=',
        wizard: '=',
      },
      templateUrl: '/app/environments/editor/s4-config.html',
      controller: DirectiveController,
      controllerAs: 'vm',
      bindToController: true
    };
  }
  
  DirectiveController.$inject = [ '$scope', 'TaskDef' ];
  
  function DirectiveController($scope, TaskDef) {
    var vm            = this;
    vm.config         = null;
    vm.configChanged  = configChanged;   
    vm.prev           = prev;
    vm.invalid        = false;
    vm.simple         = true;    
    
    activate();
    
    //////////
    
    function activate() {      
      $scope.$watch('vm.wizard.stage', function(stage) {
        if(stage === 'config') {
          if(!vm.environment.config) {
            vm.environment.config = TaskDef.create(vm.environment);
          }
          vm.config = JSON.stringify(vm.environment.config, null, 2);          
        }
      });    
    }

    function configChanged() {
      try 
      {
        vm.environment.config = JSON.parse(vm.config);
        vm.invalid = false;
      }
      catch(ex) {
        vm.invalid = true;
      }
    }

    function prev() {
      vm.wizard.stage = 'machines';
    }



  }
  
}());