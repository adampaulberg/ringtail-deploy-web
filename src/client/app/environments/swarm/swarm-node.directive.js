(function() {
  'use strict';

  angular
    .module('app.environments.swarm')
    .directive('swarmNode', swarmNode);

  function swarmNode() {
    return {
      restrict: 'E',
      scope: {
        roles: '=',
        environment: '=',
        node: '='
      },
      templateUrl: '/app/environments/swarm/swarm-node.html',
      controller: Controller,
      controllerAs: 'vm',
      bindToController: true
    };
  }

  Controller.$inject = [ '$scope','ValidationMessage', 'Swarm' ];

  function Controller($scope, ValidationMessage, Swarm) {
    var vm          = this;
    vm.environment  = this.environment;
    vm.node         = this.node;
    vm.roles        = this.roles;
    vm.roleOptions  = [];
    vm.selectedRole = null;
    vm.roleSelected = roleSelected;
    vm.removeRole   = removeRole;

    activate();

    //////////

    function activate() {
      getRoleOptions();
    }

    function getRoleOptions() {
      vm.roleOptions = vm.roles.map(role => ({ name: role.id }));
      vm.roleOptions = vm.roleOptions.filter(p => !(vm.node.Spec.Labels && vm.node.Spec.Labels[p.name]));
    }

    function roleSelected() {
      let role = vm.selectedRole;
      let body = {
        swarmhost: vm.environment.swarmhost,
        nodeId: vm.node.ID,
        label: role,
        value: 'true',
        sshKey: vm.environment.swarmSshKey,
        sshUser: vm.environment.swarmSshUser,
      };
      if(!vm.node.Spec.Labels) {
        vm.node.Spec.Labels = {};
      }
      vm.node.Spec.Labels[role] = 'configuring';
      Swarm.addLabel({}, body).$promise
        .then((node) => {
          vm.node = node;
          getRoleOptions();
          vm.selectedRole = '';
        });
    }

    function removeRole(role) {
      let body = {
        swarmhost: vm.environment.swarmhost,
        nodeId: vm.node.ID,
        label: role,
      };
      Swarm.removeLabel({}, body).$promise
        .then((node) => {
          vm.node = node;
          getRoleOptions();
        });
    }

  }

}());