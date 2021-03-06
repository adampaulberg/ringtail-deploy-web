var util    = require('util')  
  , Q       = require('q')
  , _       = require('underscore')

  , config  = require('../../../config')
  , Skytap  = require('node-skytap')
  , skytap  = Skytap.init(config.skytap)

  , Task    = require('./task');


function TaskImplementation(options) {    
  this.name = 'Get template';
  Task.call(this, options);  

  this.validators.required.push('template_id');
  this.validators.required.push('project_id');

  this.execute = function execute(scope, log) {
    var template_id = this.getData(scope, 'template_id')
      , project_id = this.getData(scope, 'project_id');

    if(template_id === 'newest') {        
      return getNewestTemplate(project_id, scope, log);
    } else {
      return getTemplateById(template_id, scope, log);
    }    

  };
}

util.inherits(TaskImplementation, Task);

module.exports = TaskImplementation;


function getNewestTemplate(project_id, scope, log) {  

  return Q.fcall(function() {
    log('finding newest template');

    return skytap.projects.templates({ project_id: project_id })  
    .then(function(templates) {      
      var result = _.max(templates, function(template) {
        return template.id;
      });  

      log('found newest template %s', result.id);
      return result;
    });
  });
}

function getTemplateById(template_id, scope, log) {
  return Q.fcall(function() {
    log('finding template %s', template_id);

    return skytap.templates.get({ template_id: template_id})
    .then(function(template) {
      log('found template %s', template.id);
      return template;
    });
  });
}