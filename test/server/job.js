var mocha   = require('mocha')
  , sinon   = require('sinon')
  , chai    = require('chai')
  , expect  = chai.expect
  , assert  = chai.assert
  , Job    = require('../../src/server/job')
  ;

describe('Job', function() {
  var job;

  describe('#constructor', function() {

    beforeEach(function() {
      job = new Job();
    });

    it('sets the status to \'pending\'', function() {
      expect(job.status).to.equal('Pending');
    });

    it('creates the start method', function() {
      expect(job.start).to.be.a('function');
    });

    it('creates the discoverWarnings method', function() {
      expect(job.discoverWarnings).to.be.a('function');
    });


    describe('when opts argument is supplied', function() {

      it('overrides existing properties', function() {
        job = new Job({ status: 'newStatus' });
        expect(job.status).to.equal('newStatus');
      });

      it('adds new properties', function() {
        job = new Job({ derp: 'derp' });
        expect(job.derp).to.equal('derp');
      });
    });
  });

  describe('#discoverWarnings', function() {
    it('doesnt mind if there are no tasks', function() {
      var warnings = null;
      job = new Job();
      expect(job.discoverWarnings).to.be.a('function');
      warnings = job.discoverWarnings();
      expect(warnings).to.equal(false);
    });

    it('finds warnings on subtasks', function() {
      var warnings = null;
      job = new Job();
      job.tasks = [{
        tasks: [{status: 'Warning'}]
      }];
      expect(job.discoverWarnings).to.be.a('function');
      warnings = job.discoverWarnings(job.tasks);
      expect(warnings).to.equal(true);
    });

    it('finds warnings on tasks', function() {
      var warnings = null;
      job = new Job();
      job.tasks = [{
        status: 'Warning',
        tasks: [{status: 'Success'}],
        tasks: [{status: 'Failure'}]
      }];
      expect(job.discoverWarnings).to.be.a('function');
      warnings = job.discoverWarnings(job.tasks);
      expect(warnings).to.equal(true);
    });

    it('finds no warnings when there are none', function() {
      var warnings = null;
      job = new Job();
      job.tasks = [{
        status: 'Success',
        tasks: [{status: 'Success'}],
        tasks: [{status: 'Success'}]
      }];
      expect(job.discoverWarnings).to.be.a('function');
      warnings = job.discoverWarnings(job.tasks);
      expect(warnings).to.equal(false);
    });    
  });
});
