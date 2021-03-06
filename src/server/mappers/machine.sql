-- insert
insert into machine (envId, machineName, machineDesc, remoteId, intIP, extIP, role, installNotes, registryNotes, configId)
values ($envId, $machineName, $machineDesc, $remoteId, $intIP, $extIP, $role, $installNotes, $registryNotes, $configId);

-- update
update machine set
  envId = $envId, machineName = $machineName, machineDesc = $machineDesc, remoteId = $remoteId, 
  intIP = $intIP, extIP = $extIP, role = $role, installNotes = $installNotes, registryNotes = $registryNotes, 
  configId = $configId
where machineId = $machineId;

-- delete
delete from machine
where machineId = $machineId;

-- findAll
select *
from machine
order by $machineName
limit $pagesize offset $offset;

-- findByEnv
select *
from machine
where envId = $envId
order by $machineName;

-- findById
select *
from machine
where machineId = $machineId;