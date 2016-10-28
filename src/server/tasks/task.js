var events  = require('events')
  , util    = require('util')
  , skytap  = require('node-skytap')
  , Q       = require('q')
  , _       = require('underscore');


function Task(options) {
  events.EventEmitter.call(this);
  this.jobId = null;
  this.status = 'Pending';
  this.started = null;
  this.stopped = null;
  this.runlog = [];
  this.rundetails = null;
  this.err = null;
  this.data = {};
  this.validators = {
    required: []
  };

  // apply options
  if(options) {
    for(var key in options) {
      if(options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }
  }

  var self = this;
  this.log = function log() {

    // format the log data
    var data = util.format.apply(this, arguments);

    // add data to the current task's log
    self.runlog.push({ date: new Date(), data: data });

    // emit that we had a log event
    self.emit('log', data);
  };
}

util.inherits(Task, events.EventEmitter);

module.exports = Task;


Task.prototype.start = async function start(scope) {
  this.started = new Date();
  this.status = 'Running';
  this.emit('start', this);
  var self = this;

  try
  {
    let result = await self.execute(scope, self.log);


    if(self.storeIn) {
      self.log('storing scope variable "%s"', self.storeIn);
      scope[self.storeIn] = result;
    }

    self.log('task complete');
    self.endTime = new Date();
    self.status = 'Succeeded';
    self.emit('success');
    self.emit('end');
  }
  catch(err) {
    self.log('An error has occured.');
    self.endTime = new Date();
    self.status = 'Failed';
    self.err = err;

    self.emit('fail', err);
    self.emit('end');
    throw err;
  }
};

Task.prototype.execute = function() {
  // This should get redefined in implementer
};

Task.prototype.getData = function getData(scope, key, expand) {
  try
  {
    if(expand)
      return getDataFromObject(scope, this.data, key);
    else
      /*jshint es5:false */
      /*jshint evil:true */
      return eval(this.data[key]);
  }
  catch (ex) {
    return this.data[key];
  }
};

Task.prototype.validate = function validate() {
  var results = [];
  results = results.concat(validateRequired(this.validators.required, this.data));

  return results.length > 0 ? results : null;
};

function getDataFromObject(scope, obj, key) {

  try
  {
    /*jshint es5:false */
    /*jshint evil:true */
    var val = key ? eval(obj[key]) : eval(obj)
      , temp;

    if(Object.prototype.toString.call(val) === '[object Object]') {
      temp = {};

      /*jshint es5:false */
      /*jshint forin:false */
      for(var valkey in val) {
        temp[valkey] = getDataFromObject(scope, val, valkey);
      }
      val = temp;
    }

    else if (Object.prototype.toString.call(val) === '[object Array]') {
      val = val.map(function(element) {
        return getDataFromObject(scope, element);
      });
    }

    return val;
  }
  catch (ex) {
    return obj[key];
  }
}

function validateRequired(required, data) {
  var results = [];

  required.forEach(function(item) {
    if(data[item] === undefined) {
      results.push({ field: item, message: 'Value is required', type: 'required' });
    }
  });

  return results;
}