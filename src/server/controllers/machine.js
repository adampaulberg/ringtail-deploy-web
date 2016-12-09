let debug = require('debug')('deployer-configs')  
  , _     = require('underscore')
  , machineSvc = require('../services/machine-service')
  ;

exports.updateIP = async function(req, res, next) {
    let machineId = req.params.machineId;
    let ip = req.params.ip;

    try {
        let machine = await machineSvc.get(machineId);
        machine.intIP = ip;
        await machineSvc.update(machine);

        res.result = {success: true};

    } catch (err) {
        res.result = {success: false};
        res.err = err;
    }

    return next();
};

exports.retry = async function(req, res, next) {
    let machineId = req.params.machineId;

    try {
        let machine = await machineSvc.get(machineId);
        await machineSvc.retry(machine);

        res.result = {success: true};
    } catch (err) {
        console.log(err)
        res.result = {success: false, error:err};
        res.err = err;
    }

    return next();

}

exports.restart = async function(req, res, next) {
    let machineId = req.params.machineId;

    try {
        let machine = await machineSvc.get(machineId);
        await machineSvc.restart(machine);

        res.result = {success: true};
    } catch (err) {
        console.log(err)
        res.result = {success: false};
        res.err = err;
    }

    return next();

}

exports.status = async function(req, res, next) {
    try {
        let machineId = req.params.machineId;
        let machine = await machineSvc.get(machineId);
        await machineSvc.status(machine);

        res.result = {success: true};
    } catch (err) {
        console.log(err)
        res.result = {success: false};
        res.err = err;
    }

    return next();    
}