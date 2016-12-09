(function () {
  'use strict';

  angular
    .module('app')
    .controller('JobDetailsController', JobDetailsController);

  JobDetailsController.$inject = [ '$routeParams', '$timeout', '$scope', 'Job' ];

  function JobDetailsController($routeParams, $timeout, $scope, Job) {    
    var vm          = this;
    vm.job          = null;
    vm.selectedTask = null;
    vm.currentTask  = null;
    vm.selectTask   = selectTask;
    vm.poll         = null;
    
    activate();
    
    //////////
    
    function activate() {
      Job.get({ jobId: $routeParams.jobId }, loadJobComplete);

      // cancel polling on scope destroy
      $scope.$on('$destroy', function() {
        $timeout.cancel(vm.poll);
      });      
    }

    function loadJobComplete(result) {
      vm.job = result;
      vm.currentTask = vm.selectedTask;
      
      if(!vm.currentTask) {
        vm.job.tasks.forEach(function(task) {
          if(task.status === 'Running') { 
            vm.currentTask = task; 
          }
        });
      }
      
      if(!vm.currentTask) {
        vm.currentTask = vm.job.tasks[0];
      }
      
      pollWhileRunning(result);
    }

    function pollWhileRunning(job) {
        vm.poll = $timeout(function() {
          job.$get(loadJobComplete);
        }, 5000);
    }

    function selectTask(task) {
      vm.selectedTask = task;
      vm.currentTask = task;
    }
  }


}());
