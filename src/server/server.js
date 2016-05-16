var path        = require('path')
  , debug       = require('debug')('deployer')
  , express     = require('express')
  , serveStatic = require('serve-static')
  , bodyParser  = require('body-parser')
  , controllers = require('./controllers')
  , config      = require('../../config')
  , app;

app = express();

// CONFIGURE BODY PARSER
app.use(bodyParser.json({ limit: '1mb' }));


// STATIC FILE ROUTES
app.use('/assets', serveStatic(__dirname + '/../client/assets'));
app.use('/assets/lib', serveStatic(__dirname + '/../client/assets/bower_components'));
app.use('/app', serveStatic(__dirname + '/../client/app'));


// DEFAULT ROUTE
function defaultRoute(req, res) {
  res.sendFile(path.resolve(__dirname +'/../client/index.html'));
}
app.get('/', defaultRoute);
app.get('/app/*', defaultRoute);



// API - CLIENT SIDE CONFIG
app.get('/config', function(req, res) {
  res
    .type('json')
    .send('window.appConfig = ' + JSON.stringify(config.client));
});

app.get('/api/alive', function(req, res){ return res.send(200); });

// API - REGION ROUTES
app.get   ('/api/regions', controllers.regions.list);
app.get   ('/api/regions/:regionId', controllers.regions.get);
app.post  ('/api/regions', controllers.regions.create);
app.put   ('/api/regions/:regionId', controllers.regions.update);
app.delete('/api/regions/:regionId', controllers.regions.del);
app.get   ('/api/regions/:regionId/branches', controllers.browse.branches);
app.get   ('/api/regions/:regionId/branches/:branch/builds', controllers.browse.builds);

// API - CONFIG ROUTES
app.post  ('/api/configs', controllers.configs.create);
app.put   ('/api/configs/:configId', controllers.configs.update);
app.delete('/api/configs/:configId', controllers.configs.del);

// API - REGION ENVIRONMENT ROUTES
app.get   ('/api/regions/:regionId/envs', controllers.regionenvs.list);
app.post  ('/api/regions/:regionId/envs/:envId', controllers.regionenvs.add);
app.delete('/api/regions/:regionId/envs/:envId', controllers.regionenvs.remove);


// API - ENVIRONMENT ROUTES
app.get   ('/api/envs', controllers.envs.list);
app.post  ('/api/envs', controllers.envs.create);
app.get   ('/api/envs/:envId', controllers.envs.get);
app.put   ('/api/envs/:envId', controllers.envs.update);
app.delete('/api/envs/:envId', controllers.envs.remove);
app.put   ('/api/envs/:envId/start', controllers.envs.start);
app.put   ('/api/envs/:envId/pause', controllers.envs.pause);
app.put   ('/api/envs/:envId/redeploy', controllers.envs.redeploy);
app.put   ('/api/envs/:envId/reset', controllers.envs.reset);
app.get   ('/api/envs/:envId/configs', controllers.configs.findByEnv);


// API - TASK ROUTES
app.get ('/api/jobs', controllers.jobs.list);
app.get ('/api/jobs/:jobId', controllers.jobs.get);


// API - SKYTAP PROXY ROUTES
app.get ('/api/skytap/environments', controllers.skytap.environments);
app.get ('/api/skytap/environments/:configuration_id', controllers.skytap.environment);

// API - TASKS
app.get ('/api/tasks', controllers.tasks.list);



// CONVERT TO UNIVERSAL HANDLER
app.all ('/api/*', function(req, res) {

  if(res.result) {

    // apply paging headers
    if(res.result.total) {
      res.set('X-Paging-Total', res.result.total);
      res.set('X-Paging-Page', res.result.page);
      res.set('X-Paging-PageSize', res.result.pagesize);
      res.set('X-Paging-LastPage', Math.ceil(res.result.total / res.result.pagesize));
    }

    var client = convertToClient(res.result);
    res.status(200).send(client);
  } else if (res.err) {
    console.error(res.err);
    console.error(res.err.trace);
    res.status(500).send(res.err);
  }

});

function convertToClient(results) {
  var util = require('util');
  if(results && results.toClient) {
    results = results.toClient();
  }
  else if(util.isArray(results)) {
    results = results.map(function(result) {
      if(result.toClient) {
        result = result.toClient();
      }
      return result;
    });
  }
  else if (results instanceof Object) {
    for(var prop in results) {
      if(results[prop] instanceof Object) {
        results[prop] = convertToClient(results[prop]);
      }
    }
  }
  return results;
}


if(config.host) {
  app.listen(config.port, config.host, function() {
    debug('Listening on %s:%d ', (config.host ? config.host : '*'), config.port);
  });
} else {
  app.listen(config.port, function() {
    debug('Listening on %s:%d ', (config.host ? config.host : '*'), config.port);
  });
}


// OVERWRITE DEFAULT DEBUG
var debugapp = require('debug');
var util = require('util');
var fs = require('fs');

debugapp.log = function() {
  // taken from node.js inside debug library
  var text = util.format.apply(this, arguments);

  // log to console and file
  console.log(text);
  fs.appendFileSync('access.log', text + '\n');
};
