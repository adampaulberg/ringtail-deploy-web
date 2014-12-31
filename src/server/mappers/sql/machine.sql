-- insert
insert into machine (envId, machineName, machineDesc, remoteId, intIP, extIP, roleId, installNotes, registryNotes)
values ($envId, $machineName, $machineDesc, $remoteId, $intIP, $extIP, $roleId, $installNotes, $registryNotes);

-- update
update machine set
  envId = $envId, machineName = $machineName, machineDesc = $machineDesc, remoteId = $remoteId, 
  intIP = $intIP, extIP = $extIP, roleId = $roleId, installNotes = $installNotes, registryNotes = $registryNotes
where machineId = $machineId;

-- delete
delete machine
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