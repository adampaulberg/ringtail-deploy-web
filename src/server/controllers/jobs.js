let debug       = require('debug')('deployer-projects');
let Q           = require('q');
let _           = require('underscore');
let jobrunner   = require('../jobrunner');
let validationrunner   = require('../validationrunner');
let cheerio     = require('cheerio');
let jobservice  = require('../services/job-service');


exports.list = (req, res) => {
  let jobs = jobrunner.getJobs();
  debug('jobs - ' + jobs.length);
  res.send(jobs);
};

exports.listValidations = (req, res) => {
  let validations = validationrunner.getValidations();
  debug('validations - ' + validations.length);
  res.send([]);
};

exports.getValidations = (req, res) => {
  let jobId = req.param('validationId');
  debug('getValidations ' + jobId);
  validationrunner.getValidation(jobId, (err, data) => {
    let runLogs = [];

    _.each(data.tasks, function(task) {
      //runLogs.push(task.tasks);
      try {
        _.each(task.tasks, function(subTask) {
          _.each(subTask.runlog, function(logItem) {
            runLogs.push(logItem.data);
          });
        });
      } catch (e) {
        runLogs.push('Something unknown went wrong with the validation job. %j', e);
      }
    });

    let alerts = _.filter(runLogs, function(log) {
      return log.startsWith('alert|');
    });

    let okay = _.filter(runLogs, function(log) {
      return log.startsWith('end|');
    });

    alerts = _.map(alerts, function(item) {
      return item.split('|')[1];
    });
    okay = _.map(okay, function(item) {
      return item.split('|')[1];
    });

    let status = data.status === 'Succeeded' ? alerts.length > 0 ? 'Failed' : 'Succeeded' : data.status;

    let response = {
      id: data.id,
      status: status,
      alerts: alerts,
      finished: okay
    }

    res.send(response);    
  });
};

exports.summaryList = function summaryList(req, res, next) {
  let timeframe = req.params.last;

  if(!timeframe || timeframe == 0) {
    timeframe = 365;
  }
  jobservice.list(null, function(err, result) {
    let tmpResult = _.filter(result, function (job) {
      return job.log !== null; 
    });

    let friendlyResult = _.map(tmpResult, function(job) {
      if(job.log === null) {
        return;
      }
      return {id: job.log.id, status: job.log.status, started: job.log.started, stopped: job.log.stopped, name: job.log.name};
    });

    let jobsSince = new Date();
    jobsSince = jobsSince.setDate(jobsSince.getDate() - timeframe);

    let recent = _.filter(friendlyResult, function(item) {
      return Date.parse(item.started) > jobsSince;
    });

    let outcomesByEnv = _.mapObject(_.groupBy(recent, 'name'), function(val) {
      return _.countBy(val, 'status' );
    });

    let successRates = _.countBy(recent, 'status');         // count by status, so we can see how many jobs succeed.
    let jobsOverTime = _.countBy(recent, function(job) {    // count by days, so we can see how many jobs run per day.
      let date = new Date(Date.parse(job.started));
      return (date.getMonth() + 1) + '-' + date.getDate();
    });

    res.result = {successRates: successRates, jobsOverTime: jobsOverTime, outcomesByEnv: outcomesByEnv};
    res.err = err;
    next();
  });
};

exports.failureDetailsList = function failureDetailsList(req, res, next) {
  let timeframe = req.params.last;
  let timeShift = 0 ;
  if(!timeframe || timeframe == 0) {
    timeframe = 365;
  }
  if(timeframe) {
    if(timeframe.split('-').length > 1) {
      timeShift = parseInt(timeframe.split('-')[0]);
      timeframe = parseInt(timeframe.split('-')[1]);
    }
  }

  jobservice.list(null, function(err, result) {
    let tmpResult = _.filter(result, function (job) {
      return job.log !== null; 
    });

    let friendlyResult = _.map(tmpResult, function(job) {
      if(job.log) {
        return {id: job.log.id, status: job.log.status, started: job.log.started, stopped: job.log.stopped, name: job.log.name, text: job.log};
      }
    });

    let jobsSince = new Date();
    jobsSince = jobsSince.setDate(jobsSince.getDate() - timeframe);

    let jobsBefore = new Date();
    jobsBefore = jobsBefore.setDate(jobsBefore.getDate() - timeShift);

    let recent = _.filter(friendlyResult, function(item) {
      return Date.parse(item.started) > jobsSince && Date.parse(item.started) < jobsBefore;
    });

    let recentFailures = _.filter(recent, function(item) {
      return item.status === 'Failed';
    });

    let recentSuccesses = _.filter(recent, function(item) {
      return item.status.startsWith('Suc');
    });

    // let nonAllinone = _.filter(recentFailures, function(item) {
    //   let isAllInOne = false;
    //     try {
    //         isAllInOne = item.text.tasks[0].tasks[0].name.toLowerCase().startsWith('all');
    //     }
    //     catch (e) {
    //       isAllInOne = false;
    //     }
    //   return isAllInOne;
    // });
    let outcomesByEnv = _.mapObject(_.groupBy(recent, 'name'), function(val) {
       return _.map(val, function(v) {
          return 'http://localhost:11234/app/jobs/' + v.id;
       });
    });

    let failedMachines = {};
    let failureContent = {failureCtx: []};

    let byMachine = {};
    _.each(recent, function(job) {
        var tasks = job.text.tasks;
        let regionName = '';
        try {
          regionName = job.text.tasks[0].taskdefs[0].options.region.regionName.toLowerCase();
        } catch (e) {
          regionName = 'unknown';
        }
        _.each(tasks, function(task) {
          var subTask = task.tasks;
          _.each(subTask, function(subTask) {
            let name = subTask.name.toLowerCase();
            name = name.split('-')[0];

            if(name.startsWith('all')) {
              name = name + '-' + regionName;
            }

            if(name.startsWith('anv') || name.startsWith('ued')) {
              // skip;
            } else {
              if(!byMachine[name]) {
                byMachine[name] = {success: 0, failed: 0};
              }
              if(subTask.status === 'Failed') {
                byMachine[name].failed += 1;
                if(!failedMachines[name]) {
                  failedMachines[name] = {failures: []};
                } 
                failedMachines[name].failures.push(job.id);
                let ctx = subTask.rundetails;
                if(ctx) {
                let ctxs = ctx.split('-----------');
                if(ctxs.length > 1) {
                  var last = ctxs[ctxs.length-1];
                  last = last.replace(/<p\>/g, ' ');
                  last = last.replace(/<\/p\>/g, ' ');
                  last = last.replace(/\\"/g, '"');
                  last = last.replace(/\\\\/g, '\\');
                  last = last.replace(/C:\\Upgrade\\AutoDeploy\\/g, '');
                  last = last.replace(/starting: /g, '');
                  last = last.split('*')[2];
                  if(last.length > 100) {
                    last = last.substring(0, 100);
                  }
                  //failureContent.failureCtx.push(last);

                  if(!failureContent[last]) {
                    failureContent[last] = 0;
                  }

                  failureContent[last] += 1;
                }
              }
              } else {
                byMachine[name].success += 1;
              }
            }
          });
        });
    });

    let jobsOverTime = _.countBy(recentFailures, function(job) {    // count by days, so we can see how many jobs run per day.
      let date = new Date(Date.parse(job.started));
      return (date.getMonth() + 1) + '-' + date.getDate();
    });

    res.result = {failuresOverTime: jobsOverTime, byMachine: byMachine, failedMachines: failedMachines, failureContent: failureContent};
    res.err = err;
    next();
  });
};

exports.get = (req, res) => {
  let jobId = req.param('jobId');

  jobrunner.getJob(jobId, (err, data) => {
    res.send(data);
  });
};

exports.downloadLog = function downloadLog(req, res) {
  let jobId = req.param('jobId');

  jobrunner.getJob(jobId, function(err, data){
    let filename = 'deployer.' +jobId + '.log.txt';
    let formattedlog = '';
    let content = data;

    try {
      content = JSON.stringify(content, null, 4);

      for(let task of data.tasks) {
        formattedlog += 'JOB ID: ' + task.id + '\n';
        formattedlog += 'TASK NAME: ' + task.name + '\n';
        formattedlog += 'STARTED: ' + task.started + '\n';
        formattedlog += 'ENDED: ' + (task.stopped||task.endTime) + '\n';
        formattedlog += 'STATUS: ' + task.status + '\n\n';

        if(task.taskdefs) {
          formattedlog += 'TASK DEFINITIONS:\n';
          formattedlog += JSON.stringify(task.taskdefs, null, 4) + '\n\n';
        }

        if(task.runlog) {
          formattedlog += 'RUNLOG:\n';
          
          for(let log of task.runlog) {
            formattedlog += log.date + ' - ' + log.data + '\n\n';
          }
        }

        if(task.tasks) {
          for(let t of task.tasks) {
            formattedlog += 'TASK NAME: ' + t.name + '\n';
            formattedlog += 'STARTED: ' + t.started + '\n';
            formattedlog += 'ENDED: ' + t.endTime + '\n';
            formattedlog += 'STATUS: ' + t.status + '\n\n';
            
            if(t.runlog) {
              formattedlog += '############RUN LOG BLOCK############\n';
              for(let subtask of t.runlog) {
                formattedlog += subtask.date + ' - ';
                let data = subtask.data;

                if(/\<p\>/i.test(data)) {
                  let $ = cheerio.load(data);                
                  data = '';

                  $('p').each((i, elem) => {
                    data += $(elem).html() + '\n';
                  });
                }
                
                formattedlog += data + '\n\n';
              }
              formattedlog += '############RUN LOG BLOCK############\n';
              
            }
          }
        }

        formattedlog += '-------------------------------------------------\n\n';
      }

    } catch(err) {}

    res.set({'Content-Disposition':'attachment; filename=\'' + filename + '\''});
   	res.send(formattedlog);
  });
};