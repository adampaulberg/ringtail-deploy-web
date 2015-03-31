var debug           = require('debug')('deployer-branches')
  , Q               = require('q')
  , regionService   = require('../services/region-service')
  , browserFactory  = require('../services/browser-factory')  
  ;


exports.branches = function branches(req, res, next) {  
  var id = req.params.regionId;

  Q.fcall(function() { 
      return regionService.findById(id);
    })
    .then(function(region) {  
      return browserFactory.fromRegion(region);
    })
    .then(function(browser) {
      var result = [];
      if(browser) {      
        result = browser.branches();
      }
      return result;
    })
    .then(function(branches) {
      res.send(branches);
    })
    .fail(function(err) {
      res.status(500).send(err.message);
    });
};



exports.builds = function builds(req, res, next) {
  var id      = req.params.regionId
    , branch  = req.params.branch
    ;

  Q.fcall(function() { 
      return regionService.findById(id);
    })
    .then(function(region) {  
      return browserFactory.fromRegion(region);
    })
    .then(function(browser) {
      var result = [];
      if(browser) {      
        result = browser.builds(branch);
      }
      return result;
    })
    .then(function(builds) {      
      res.send(builds);
    })
    .fail(function(err) {
      res.status(500).send(err.message);
    });
};