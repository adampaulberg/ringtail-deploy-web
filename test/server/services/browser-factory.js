var mocha   = require('mocha')
  , sinon   = require('sinon')
  , chai    = require('chai')
  , expect  = chai.expect
  ;

describe('Browser Factory', function() {
  var sut           = require('../../../src/server/services/browser-factory')
    , EmptyBrowser  = require('../../../src/server/services/browsers/empty-browser')
    , HttpBrowser   = require('../../../src/server/services/browsers/http-browser')
    , SmbBrowser    = require('../../../src/server/services/browsers/smb-browser')
    , StaticBrowser = require('../../../src/server/services/browsers/static-browser')
    ;

  describe('.fromRegion', function() {

    describe('when no browseConfig set', function() {
      it('should create an EmptyBrowser', function() {
        var region = {};
        var result = sut.fromRegion(region);
        expect(result).to.be.instanceOf(EmptyBrowser);
      });
    });

    describe('with unknown browser type', function() {      
      it('should create an EmptyBrowser', function() {
        var region = { browseConfig: { type: '' } };
        var result = sut.fromRegion(region);
        expect(result).to.be.instanceOf(EmptyBrowser);
      });
    });

    describe('with http browser type', function() {
      it('should create an HttpBrowser', function() {
        var region = { browseConfig: { type: 'http' } };
        var result = sut.fromRegion(region);
        expect(result).to.be.instanceOf(HttpBrowser);
      });
    });

    describe('with smb browser type', function() {
      it('should create an SmbBrowser', function() {
        var region = { browseConfig: { type: 'smb' } };
        var result = sut.fromRegion(region);
        expect(result).to.be.instanceOf(SmbBrowser);
      });
    });

    describe('with static browser type', function() {
      it('should create a StaticBrowser', function() {
        var region = { browseConfig: { type: 'static' } };
        var result = sut.fromRegion(region);
        expect(result).to.be.instanceOf(StaticBrowser);
      });
    });
    
  });
});
