var EmptyBrowser  = require('./browsers/empty-browser')
  , HttpBrowser   = require('./browsers/http-browser')
  , SmbBrowser = require('./browsers/smb-browser')
  ;

/**
 * Creates a browser object based on the region's
 * configurations settings in the browerConfig.type property
 * 
 * @param {Region} region - a region instance
 * @return {Browser} returns a Browser instance which will
 * default to EmptyBrowser if it can't build the appropriate
 * browser
 */
exports.fromRegion = function(region) {
  var config = region.browseConfig || {}
    , result = null
    ;

  if(config.type === 'http') {
    result = new HttpBrowser(config);
  }   
  else if (config.type === 'ftp') {
      var FtpBrowser = require('./browsers/ftp-browser');
      result = new FtpBrowser(config);
   }
  else if (config.type === 'smb') {
    result = new SmbBrowser(config);
  }
  else {
    result = new EmptyBrowser(config);
  }

  return result;  
};