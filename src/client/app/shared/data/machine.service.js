(function() {
  'use strict';

  angular
    .module('shared.data')
    .service('Machine', Machine);

  Machine.$inject = [ '$resource' ];
 
  function Machine($resource) {
    return $resource(
      'api/machine/:machineId', 
      { machine: '@machineId' },
      {
        retry  : { method: 'GET', url: 'api/machine/:machineId/retry' },
        restart  : { method: 'GET', url: 'api/machine/:machineId/restart' },
        status : { method : 'GET', url: 'api/machine/:machineId/status'}
      }
    );
  }

}());