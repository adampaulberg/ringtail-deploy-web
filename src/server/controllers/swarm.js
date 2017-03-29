
let swarm = require('../services/swarm-service');

module.exports = {
  info,
  nodes,
  deployments,
  deploy,
  deployService,
  addLabel,
  removeLabel,
};

/**
 * [config description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
async function info(req, res) {
  let {swarmhost} = req.query;
  if(!swarmhost) {
    return res.status(404).send('swarmhost is required');
  }

  let info = await swarm.getInfo(swarmhost);
  res.send(info);
}

/**
 * [list description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
async function nodes(req, res) {
  let {swarmhost} = req.query;
  if(!swarmhost ) {
    res.send([]);
    return;
  }

  let nodes = await swarm.getNodes(swarmhost);
  res.send(nodes);
}


/**
 * [deployments description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
async function deployments(req, res) {
  let {swarmhost} = req.query;
  if(!swarmhost) {
    res.send({ services: [], tasks: [] });
    return;
  }

  let deployments = await swarm.getDeployments(swarmhost);
  res.send(deployments);
}


/**
 * [description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
async function deploy(req, res, next) {
  let {
    swarmhost,
    accessKeyId,
    secretAccessKey,
  } = req.body;

  if(!swarmhost) {
    return res.status(400).send('swarmhost is required');
  }

  await swarm.deployStacks({ swarmhost, accessKeyId, secretAccessKey });
  res.send({ ok: true });
};

/**
 * [deployService description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
async function deployService(req, res, next) {
  let {
    swarmhost,
    accessKeyId,
    secretAccessKey,
    service,
  } = req.body;

  if(!swarmhost) {
    return res.status(400).send('swarmhost is required');
  }

  if(!service) {
    return res.status(400).send('servie is required');
  }

  await swarm.deployService({ swarmhost, accessKeyId, secretAccessKey, service });
  res.send({ ok: true });
}


/**
 * [addLabel description]
 * @param {[type]} req [description]
 * @param {[type]} res [description]
 */
async function addLabel(req, res) {
  let {
    swarmhost,
    nodeId,
    label,
    value,
    sshKey,
    sshUser,
  } = req.body;

  let node = await swarm.addLabel({ swarmhost, nodeId, label, value, sshKey, sshUser });
  res.send(node);
}

/**
 * [removeLabel description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
async function removeLabel(req, res) {
  let {
    swarmhost,
    nodeId,
    label
  } = req.body;

  console.log('Removing label');
  let node = await swarm.removeLabel({ swarmhost, nodeId, label });
  res.send(node);
}