let _ = require('underscore');
let Q = require('q');
let debug = require('debug')('deployer-browsers-ftp-browser');
let path = require('path');
let edge = require('edge');
let ftp = edge.func(path.join(__dirname, 'FTPOperations.csx'));


function FTPBrowser(config) {
  _.extend(this, config);
}

module.exports = FTPBrowser;

/**
 * Retrieves the list of branches as an array of strings
 *
 * @param {function} [next] - node callback
 * @return {promise}
 */
FTPBrowser.prototype.branches = function branches(next) {
  var deferred = Q.defer()
   , ACTION = {
        DIRECTORY: { value: 'DIRECTORY' },
        FILE: { value: 'FILE' }
      }
  , currentAction = ACTION.DIRECTORY
  , params = {
      ftpHost: this.ftpHost,
      ftpUser: this.ftpUser,
      ftpPassword: this.ftpPassword,
      ftpProxyHost: this.ftpProxyHost,
      ftpProxyPort: '',
      action: currentAction.value,
      branch: this.ftpRootPath,
      currentVersion: this.currentVersion,
      scriptLocation: __dirname
   };

  debug('looking for branches via ftp');

  ftp(params, function (error, result) {
    if (error) deferred.reject(error);
    else deferred.resolve(result);
  });
  return deferred.promise.nodeify(next);
};

// __dirname
/**
 * Retrieves the list of builds for a branch as a list of strings
 *
 * @param {string} branch - the branch to retrieve builds for
 * @param {function} [next] - node callback
 * @return {promise}
 */
FTPBrowser.prototype.builds = function builds(branch, next) {
  var deferred = Q.defer()
   , ACTION = {
        DIRECTORY: { value: 'DIRECTORY' },
        FILE: { value: 'FILE' }
      }
  , currentAction = ACTION.DIRECTORY
  , params = {
        ftpHost: this.ftpHost,
        ftpUser: this.ftpUser,
        ftpPassword: this.ftpPassword,
        ftpProxyHost: this.ftpProxyHost,
        ftpProxyPort: '',
        action: currentAction.value,
        branch: '',
        currentVersion: this.currentVersion,
        scriptLocation: __dirname
      };

  
  params.branch = this.ftpRootPath.replace(/\/$/, '') + '/' + branch;
  ftp(params, function (error, result) {
    if (error) deferred.reject(error);
    else deferred.resolve(result);
  });
  return deferred.promise.nodeify(next);
};

/**
 * Retrieves the list of Files for a build as a list of strings
 * Uses *.exe as the filter
 *
 * @param {string} branch - the branch to retrieve builds for
 * @param {function} [next] - node callback
 * @return {promise}
 */
FTPBrowser.prototype.files = function files(branch, next) {
  var deferred = Q.defer()
   , ACTION = {
        DIRECTORY: { value: 'DIRECTORY' },
        FILE: { value: 'FILE' }
      }
  , currentAction = ACTION.FILE
  , params = {
        ftpHost: this.ftpHost,
        ftpUser: this.ftpUser,
        ftpPassword: this.ftpPassword,
        ftpProxyHost: this.ftpProxyHost,
        ftpProxyPort: '',
        action: currentAction.value,
        branch: this.ftpRootPath.replace(/\/$/, '') + '/' + branch,
        currentVersion: this.currentVersion,
        scriptLocation: __dirname
      };

  branch = branch.replace('\\', '/');
  params.branch = this.ftpRootPath.replace(/\/$/, '') + '/' + branch;
  ftp(params, function (error, result) {
    if (error) {
      deferred.reject(error);
    }
    else {
      deferred.resolve(result);
    }
  });
  return deferred.promise.nodeify(next);
};
