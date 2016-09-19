require('babel-register');
require('babel-polyfill');

let bodyParser  = require('body-parser');
let config      = require('../../config');
let controllers = require('./controllers');
let cookieParser = require('cookie-parser');
let debug       = require('debug')('deployer');
let express     = require('express');
let fs          = require('fs');
let join        = require('path').join;
let jwt         = require('jsonwebtoken');
let logger      = require('morgan');
let migrate     = require('migrate');
let nib         = require('nib');
let path        = require('path');
let serveStatic = require('serve-static');
let session     = require('express-session');
let stylus      = require('stylus');
let URL         = require('url');

let app  = express();

let key, cert;
let hour = 3600000;

//JWT CERTS
try {
  key = fs.readFileSync(join(__dirname, '../../certs/') + config.certificate.key);
  cert = fs.readFileSync(join(__dirname, '../../certs/') + config.certificate.cert);
} catch(err) {
  console.error('certificates could not be found');
}

//STYLUS MIDDLEWARE
let stylusDir = join(__dirname, '/../client/assets/stylus');
let cssDir = join(__dirname, '/../client/');

function compile(str, path){
  return stylus(str)
  .set('filename', path)
  .use(nib());
}

app.use(stylus.middleware({
  src: cssDir,
  debug: true,
  force: true,
  compile: compile
}));

// CONFIGURE BODY PARSER
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(cookieParser(config.cookieSecret));

app.use(session({
   secret : config.cookieSecret,
   name : 'sessionId',
   rolling: true
  })
);

app.disable('x-powered-by');
app.set('trust proxy', 1);

// STATIC FILE ROUTES
app.use('/assets', serveStatic(__dirname + '/../client/assets'));
app.use('/assets/lib', serveStatic(__dirname + '/../client/assets/bower_components'));
app.use('/app', serveStatic(__dirname + '/../client/app'));
// app.use(logger('dev'));

function getRedirectUrl(req) {
    let parsedUrl = URL.parse(req.url);
    let hostname = req.headers.host;
    let protocol = req.connection.encrypted ? 'https://' : 'http://';
    let pathname = parsedUrl.pathname || '';
    let search = parsedUrl.search || '';

    let returnUrl = protocol + hostname + pathname + search;
    let redirectUrl = config.ringtail.url + returnUrl;

    return redirectUrl;  
}

// DEFAULT ROUTE
function defaultRoute(req, res) {
  res.sendFile(path.resolve(__dirname +'/../client/index.html'));
}

function checkLogin(req, res, next) {
  let isLoggedin = false;
  
  if( (!config.ldap || !config.ldap.enabled) &&
    (!config.ringtail || !config.ringtail.enabled) ) {
    return next('route');
  }

  if(req.method == 'POST' && req.body.token) {
    let token = req.body.token;
    let decoded = jwt.verify(token, cert);

    res.cookie('auth', decoded, { maxAge: hour * 2, signed: true, rolling: true});

    return res.redirect(req.url);
  }
  else if(req.signedCookies && req.signedCookies[config.ringtail.cookieName]){
    isLoggedin = true;
  }
  else if(req.signedCookies && req.signedCookies['auth']) {
    let authCookie = req.signedCookies['auth'];

    res.cookie('auth', authCookie, { maxAge: hour * 2, signed: true, rolling: true});

    isLoggedin = true;
  }

  if(!isLoggedin){
    if(req.xhr) {
      let data = {
        error: 'Login required',
        success: false
      };

      return res.json(data);
    } else if(config.ringtail.enabled) {
      let redirectUrl = getRedirectUrl(req);

      return res.redirect(redirectUrl);
    }

    return res.sendFile(path.resolve(__dirname +'/../client/login.html'));
  } else {
    
    return next('route');
  }
}

// API - HEALTH CHECK
app.get   ('/api/online', (req, res) => { return res.send(200); });

// API - LOGIN ROUTES
app.post  ('/api/login', controllers.auth.login);
app.get   ('/api/session', (req, res) => {
  //if login not enabled, just say we're logged in
  if( (!config.ldap || !config.ldap.enabled) &&
    (!config.ringtail || !config.ringtail.enabled) ) {
    return res.send({
      loggedIn: true,
      disabledCheck: true
    });
  }
  else if(req.signedCookies && req.signedCookies['auth']) {
    let user = req.signedCookies['auth'].user || null;
    
    return res.send({
      loggedIn: true,
      user: user
    });
  }
  else if(req.signedCookies && req.signedCookies[config.ringtail.cookieName] ){
    let user = req.signedCookies[config.ringtail.cookieName].user || null;
    
    return res.send({
      loggedIn: true,
      user: user
    });
  }

  return res.send({
    loggedIn: false
  });
});

//ALL ROUTES PAST HERE REQUIRE LOGIN
app.all   ('*', checkLogin);

// APP ROUTES
app.get   ('/',  defaultRoute);
app.get   ('/app/*', defaultRoute);

// API - CLIENT SIDE CONFIG
app.get('/config', function(req, res) {
  res
    .type('json')
    .send('window.appConfig = ' + JSON.stringify(config.client));
});

// API - REGION ROUTES
app.get   ('/api/regions', controllers.regions.list);
app.get   ('/api/regions/:regionId', controllers.regions.get);
app.post  ('/api/regions', controllers.regions.create);
app.put   ('/api/regions/:regionId', controllers.regions.update);
app.delete('/api/regions/:regionId', controllers.regions.del);
app.get   ('/api/regions/:regionId/branches', controllers.browse.branches);
app.get   ('/api/regions/:regionId/branches/:branch/builds', controllers.browse.builds);
app.get   ('/api/regions/:regionId/branches/:branch/version/:version/files', controllers.browse.files);

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
app.get   ('/api/envs/:envId/version', controllers.envs.version);
app.get   ('/api/envs/:envId/branches/:branch/launchKeys', controllers.configs.launchKeys);
app.get   ('/api/envs/:envId/branches/:branch/litKeys', controllers.configs.litKeys);
app.put   ('/api/envs/sendLaunchKeys', controllers.configs.sendLaunchKeys);


// API - TASK ROUTES
app.get ('/api/jobs', controllers.jobs.list);
app.get ('/api/jobs/:jobId', controllers.jobs.get);
app.get ('/api/job/:jobId/log', controllers.jobs.downloadLog);


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

    let client = convertToClient(res.result);
    res.status(200).send(client);
  } else if (res.err) {
    console.error(res.err);
    console.error(res.err.trace);
    res.status(500).send(res.err);
  }

});

function convertToClient(results) {
  let util = require('util');
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
    for(let prop in results) {
      if(results[prop] instanceof Object) {
        results[prop] = convertToClient(results[prop]);
      }
    }
  }
  return results;
}


let migrationPath = join(__dirname, '../../migrations');
let migrationDataPath = join(__dirname, '../../data');
let migrationFilePath = join(migrationDataPath, '/.migrate');

let set = migrate.load(migrationFilePath, migrationPath);
set.up(function (err) {
  if (err) {
    console.error('failed to migrate db');
    throw err;
  }
  console.log('DB Tasks Completed');
  
  if(config.host) {
    app.listen(config.port, config.host, function() {
      debug('Listening on %s:%d ', (config.host ? config.host : '*'), config.port);
    });
  } else {
    app.listen(config.port, function() {
      debug('Listening on %s:%d ', (config.host ? config.host : '*'), config.port);
    });
  }
});

// OVERWRITE DEFAULT DEBUG
let debugapp = require('debug');
let util = require('util');

debugapp.log = function() {
  // taken from node.js inside debug library
  let text = util.format.apply(this, arguments);

  // log to console and file
  console.log(text);
  fs.appendFileSync('access.log', text + '\n');
};
