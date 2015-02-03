var Model       = require('hops-model')
  , schema
  , Machine
  ;

/* jshint es5:false */
/* jshint ignore:start */
schema = {
  "properties": [
    { "name": "regionId" },    
    { "name": "regionName", "required": true },
    { "name": "regionDesc" }
  ]
};
/* jshint ignore:end */


Machine = Model.extend(schema);
module.exports = Machine;