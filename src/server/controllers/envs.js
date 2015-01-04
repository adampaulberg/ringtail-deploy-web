var debug       = require('debug')('deployer-environments')
  , envService  = require('../services/envService')
  ;


exports.list = function list(req, res, next) {
  debug('listing environments');
  envService
    .findAll(null, function(err, result) {
      res.result = result;
      res.err = err;
      next();
    });
};


exports.get = function get(req, res, next) {
  debug('getting environment');
  var envId = req.param('envId');
  envService
    .findById(envId, function(err, result) {
      res.result  = result;
      res.err     = err;
      next();
    });   
};


exports.create = function create(req, res, next) {
  debug('creating environment');
  var data = req.body;
  envService
    .create(data, function(err, result) {
      res.result = result;
      res.err = err;
      next();
    });
};

exports.update = function update(req, res, next) {
  debug('updating environments');
  var data = req.body;
  envService
    .update(data, function(err, result) {
      res.result = result;
      res.err = err;
      next();
    });
};

exports.start = function start(req, res, next) {
  debug('starting environment');
  var data          = req.body
    , suspendOnIdle = req.param('suspend_on_idle');

  envService
    .start(data, suspendOnIdle, function(err, result) {
      res.result = result;
      res.err = err;
      next();
    });
};

exports.pause = function pause(req, res, next) {
  debug('pausing environment');
  var data = req.body;

  envService
    .pause(data, function(err, result) {
      res.result  = result;
      res.err     = err;
      next();
    });
};