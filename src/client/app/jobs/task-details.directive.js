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
  
  TaskDetailsController.$inject = [ '$scope', '$timeout', 'Machine' ];

  function TaskDetailsController($scope, $timeout, Machine) {
    var vm          = this;
    vm.selectedTab  = 0;
    vm.tabs         = [];
    vm.selectTab    = selectTab;
    vm.showLaunchKeys = true;
    vm.newLaunchKeys  = [];
    vm.restart        = restart;
    vm.retry          = retry;

    vm.restartPoll = {};
    vm.restartingMachines = {};
    
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

    function restart(tab) {
      var machineId = tab.task.machineId;
      tab.restarting = true;
      
      Machine.restart({machineId: machineId}, function(){     
        pollIsRestarted(tab);
      });
    }

    function pollIsRestarted(tab) {
      var machineId = tab.task.machineId;

      /*machine takes awhile to shutdown, so we need to check 
        to see if it has before approving the success*/
      if(!vm.restartingMachines[tab.title]) {
        vm.restartingMachines[tab.title] = {
          hasGoneDown: false
        };
      }

      vm.restartPoll[tab.title] = $timeout(function() {
        var restartMachine = vm.restartingMachines[tab.title];

        Machine.status({machineId: machineId}, function(data){
          if(data.success && restartMachine.hasGoneDown) {
            delete vm.restartPoll[tab.title];
            delete vm.restartingMachines[tab.title];
            tab.restarting = false;
          } else if(!data.success) {
            restartMachine.hasGoneDown = true;
            pollIsRestarted(tab);            
          } else { 
            pollIsRestarted(tab);
          }
        });
      }, 5000);
    }

    function retry(tab){
      let machineId = tab.task.machineId;
      tab.showRestart = false;
      
      Machine.retry({machineId: machineId}, function(){
        
      });
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
          newLaunchKeys: vm.newLaunchKeys,
          showRestart: false,
          restarting: false
        });

        if(rootTask.tasks) {
          rootTask.tasks.forEach(function(task, idx) {
            var showRestart = false;          
            var isWarning = false;
            var title = task.name;

            task.runlog.forEach(function(runlog) {
              isWarning = isWarning ? true : runlog.data.indexOf('UPGRADE WARNING') >= 0;
              runlog.status = runlog.data.indexOf('UPGRADE WARNING') >= 0 ? 'Warn' : 'OK';
            });

            try {
              var lastLog = task.runlogArray[task.runlogArray.length -1];
              if(lastLog.indexOf('UPGRADE RETRY') >= 0 || lastLog.indexOf('retry.bat') >= 0) {
                showRestart = true;
              }
            } catch(err) {
              console.error("Retry Dialog", err);
              //if this errors for some reason, we just don't show UI'
            }

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
              disabled: false,
              showRestart: showRestart,
              restarting: vm.restartPoll[task.name] && true || false
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
