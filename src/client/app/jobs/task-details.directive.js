(function () {
  'use strict';

  angular
    .module('app')
    .directive('taskDetails', taskDetails)
    .controller('TaskDetailsController', TaskDetailsController);

  function taskDetails() {
    return { 
      restrict: 'E',
      scope: {
        task: '='
      },
      templateUrl: '/app/jobs/task-details.directive.html',
      controller: 'TaskDetailsController',
      controllerAs: 'vm'
    };
  }
  
  TaskDetailsController.$inject = [ '$scope' ];

  function TaskDetailsController($scope) {
    var vm          = this;
    vm.selectedTab  = 0;
    vm.tabs         = [];
    vm.selectTab    = selectTab;
    vm.showLaunchKeys = true;
    vm.newLaunchKeys = [];
    
    activate();
    
    //////////
    
    function activate() {
      $scope.$parent.$watch('vm.job.env', onEnvUpdate);      
      $scope.$parent.$watch('vm.currentTask', onTaskUpdate);
    }

    function onEnvUpdate(rootEnv) {
      if(rootEnv && rootEnv.newLaunchKeys) {
        vm.newLaunchKeys = rootEnv.newLaunchKeys;
      }
    }

    function onTaskUpdate(rootTask) {
      if(rootTask) {        
        vm.tabs = [];
      
        if(rootTask && rootTask.taskdefs && rootTask.taskdefs[0] && rootTask.taskdefs[0].task != '3-install-machine') {
          vm.showLaunchKeys = false; 
        }

        vm.tabs.push({
          title: rootTask.name,
          task: rootTask,
          active: vm.selectedTab === 0,
          disabled: false,
          newLaunchKeys: vm.newLaunchKeys
        });

        if(rootTask.tasks) {
          rootTask.tasks.forEach(function(task, idx) {
            var isWarning = false,
              title = task.name;

            task.runlog.forEach(function(runlog) {
              isWarning = isWarning ? true : runlog.data.indexOf('UPGRADE WARNING') >= 0;
              runlog.status = runlog.data.indexOf('UPGRADE WARNING') >= 0 ? 'Warn' : 'OK';
            });

            if(isWarning) {
              task.status = 'Warn';
              if(rootTask.status === 'Succeeded') { // don't want to make failures look like warnings.
                rootTask.status = 'Warn';
              }
            }

            vm.tabs.push({
              title: task.name,
              task: task,
              active: vm.selectedTab === idx + 1,
              disabled: false
            });
          });       
        }
      }
    }

    function selectTab(index) {      
      vm.selectedTab = index;
    }
  }

}());
