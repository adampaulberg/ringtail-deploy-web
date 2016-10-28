var Q       = require('q')
  , mocha   = require('mocha')
  , sinon   = require('sinon')
  , chai    = require('chai')
  , expect  = chai.expect
  , assert  = chai.assert

  , Task    = require('../../../src/server/tasks/task')
  ;

describe('Task', function() {
  var task;

  describe('#constructor', function() {

    beforeEach(function() {
      task = new Task();
    });

    it('sets the status to \'pending\'', function() {
      expect(task.status).to.equal('Pending');
    });

    it('creates the log method', function() {
      expect(task.log).to.be.a('function');
    });


    describe('when opts argument is supplied', function() {

      it('overrides existing properties', function() {
        task = new Task({ status: 'newStatus' });
        expect(task.status).to.equal('newStatus');
      });

      it('adds new properties', function() {
        task = new Task({ derp: 'derp' });
        expect(task.derp).to.equal('derp');
      });
    });
  });

  describe('#validate', function() {

    describe('when validating required configuration data', function() {

      beforeEach(function() {
        task = new Task();
        task.validators.required.push('test');
      });

      it('returns null when valid', function() {
        task.data = { 'test': 'test' };
        var result = task.validate();
        expect(result).to.be.null;
      });

      it('returns validation error objects', function() {
        var result = task.validate();
        expect(result).to.be.an('array');
        expect(result.length).to.equal(1);
      });

    });

  });


  describe('#getData', function() {
    var scope;

    beforeEach(function() {
      task = new Task();
      scope = {};
    });


    describe('when value is on scope object', function() {

      it('resolves simple types from scope', function() {
        task.data.resolveMe = 'scope.someValue';
        scope.someValue = 'Simple resolution';

        var result = task.getData(scope, 'resolveMe');
        expect(result).to.equal('Simple resolution');
      });

      it('resolves object properties from scope', function() {
        task.data.resolveMe = 'scope.someObj.someProp';
        scope.someObj = { someProp: 'Hello World' };

        var result = task.getData(scope, 'resolveMe');
        expect(result).to.equal('Hello World');
      });

      it('resolves an array value from scope', function() {
        task.data.resolveMe = 'scope.someArray[0]';
        scope.someArray = [ 'Hello World' ];

        var result = task.getData(scope, 'resolveMe');
        expect(result).to.equal('Hello World');
      });

      it('resolves an expression ', function() {
        task.data.resolveMe = 'scope.newValue = scope.someValue + "!"';
        scope.someValue = 'Hello World' ;

        var result = task.getData(scope, 'resolveMe');
        expect(scope.newValue).to.equal('Hello World!');
      });

    });


    describe('when value is not on scope object', function() {

      it('resolves simple types from data', function() {
        task.data.resolveMe = 'Hello World';

        var result = task.getData(scope, 'resolveMe');
        expect(result).to.equal('Hello World');
      });

    });


    describe('when expanding an object', function(){

      it('resolves each value in an object', function() {
        scope.value1 = 'Value1';
        scope.value2 = 'Value2';
        task.data.expand = {
          'value1': 'scope.value1',
          'value2': 'scope.value2'
        };

        var result = task.getData(scope, 'expand', true);
        expect(result.value1).to.equal('Value1');
        expect(result.value2).to.equal('Value2');
      });

    });


    describe('when expanding an array', function () {

      it('resolves each value in the array', function() {
        scope.value1 = 'Value1';
        scope.value2 = 'Value2';
        task.data.expand = [
          'scope.value1',
          'scope.value2'
        ];

        var result = task.getData(scope, 'expand', true);
        expect(result[0]).to.equal('Value1');
        expect(result[1]).to.equal('Value2');
      });

      it('resolves each object in the array', function() {
        scope.value1 = 'Value1';
        scope.value2 = 'Value2';
        task.data.expand = [
          { 'value1': 'scope.value1' },
          { 'value2': 'scope.value2' }
        ];

        var result = task.getData(scope, 'expand', true);
        expect(result[0].value1).to.equal('Value1');
        expect(result[1].value2).to.equal('Value2');
      });

    });

  });


  describe('#start', function() {
    var scope
      , mock;

    beforeEach(function(){
      task = new Task();
      task.execute = function() {};
      scope = {};

      mock = sinon.mock(task);
      mock
        .expects('execute')
        .returns(new Q('I am the result'))
        .once()
        .withArgs(scope, task.log);
    });

    it('sets \'started\' property', function() {
      task.start(scope);
      expect(task.started).to.be.a('date');
    });

    it('sets status to \'Running\'', function() {
      task.start(scope);
      expect(task.status).to.equal('Running');
    });

    it('emits a start event', function(done) {
      task.on('start', function() {
        done();
      });
      task.start(scope);
    });

    it('calls execute only once', function(done) {
      task
        .start(scope)
        .then(() => mock.verify())
        .then(() => done());
    });

    it('stores execute results on scope', function(done) {
      task.storeIn = 'resultProp';
      task
        .start(scope)
        .then(function() {
          expect(scope.resultProp).to.equal('I am the result');
        })
        .then(done);
    });


    describe('when successful', function() {
      it('sets \'endTime\' property', function(done) {
        task
          .start(scope)
          .then(function() {
            expect(task.endTime).to.be.a('date');
          })
          .then(done);
      });

      it('sets the status to \'Succeeded\'', function(done) {
        task
          .start(scope)
          .then(function() {
            expect(task.status).to.equal('Succeeded');
          })
          .then(done);
      });

      it('emits a \'success\' event', function(done) {
        task.on('success', done);
        task.start(scope);
      });

      it('emits an \'end\' event', function(done) {
        task.on('end', done);
        task.start(scope);
      });
    });


    describe('when there is a failure', function() {

      beforeEach(function() {
        task.execute = sinon.stub().throws('I failed');
      });

      it('sets \'endTime\' property', function(done) {
        task
          .start(scope)
          .then(
            function() {
              assert.fail();
            },
            function(err) {
              expect(task.endTime).to.be.a('date');
              expect(err.name).to.equal('I failed');
            })
          .then(done);
      });

      it('sets the status to \'Failed\'', function(done) {
        task
          .start(scope)
          .then(
            function() {
              assert.fail();
            },
            function() {
              expect(task.status).to.equal('Failed');
            })
          .then(done);
      });

      it('emits a \'fail\' event', function(done) {
        task.on('fail', function(err) { done(); });
        task.start(scope);
      });

      it('emits an \'end\' event', function(done) {
        task.on('end', done);
        task.start(scope);
      });

    });

  });

  describe('#warning', function() {
        var scope
      , mock;

    beforeEach(function(){
      task = new Task();
      task.execute = function() {};
      task.Warning = true;
      scope = {};

      mock = sinon.mock(task);
      mock
        .expects('execute')
        .returns(new Q('I am the result'))
        .once()
        .withArgs(scope, task.log);
    });

    it('sets \'started\' property', function() {
      task.start(scope);
      expect(task.started).to.be.a('date');
    });

    it('sets status to \'Running\'', function() {
      task.start(scope);
      expect(task.status).to.equal('Running');
    });

    it('emits a start event', function(done) {
      task.on('start', function() {
        done();
      });
      task.start(scope);
    });

    it('calls execute only once', function(done) {
      task
        .start(scope)
        .then(() => mock.verify())
        .then(() => done());
    });

    it('stores execute results on scope', function(done) {
      task.storeIn = 'resultProp';
      task
        .start(scope)
        .then(function() {
          expect(scope.resultProp).to.equal('I am the result');
        })
        .then(done);
    });

    describe('when there is a warning', function() {
      it('sets \'endTime\' property', function(done) {
        task.Warning = true;
        task
          .start(scope)
          .then(function() {
            expect(task.endTime).to.be.a('date');
          })
          .then(done);
      });

      it('sets the status to \'Warning\'', function(done) {
        task
          .start(scope)
          .then(function() {
            expect(task.status).to.equal('Warning');
          })
          .then(done);
      });

      it('emits a \'warning\' event', function(done) {
        task.on('warning', done);
        task.start(scope);
      });

      it('emits an \'end\' event', function(done) {
        task.on('end', done);
        task.start(scope);
      });
    });
  });

  describe('#log', function() {

    beforeEach(function() {
      task = new Task();
    });

    it('adds a record to the runlog', function() {
      task.log('hello');
      expect(task.runlog.length).to.equal(1);
      expect(task.runlog[0].date).to.be.a('date');
      expect(task.runlog[0].data).to.equal('hello');
    });

    it('formats text using standard util.format', function() {
      task.log('hello %s', 'world');
      expect(task.runlog[0].data).to.equal('hello world');
    });

    it('emits a \'log\' event', function(done) {
      task.on('log', function(log) { done(); });
      task.log('hello world');
    });

  });

});