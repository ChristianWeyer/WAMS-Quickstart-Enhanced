function insert(item, user, request) {
    var azure = require('azure'); 
    var deviceRegistrationService = azure.createServiceBusService('christianweyer', 'd51qlxrbdG5KzWBjvjGvyWl8EJYqTRLsw6EXIQHgzcM='); 
    
    var message = {
        body: item.deviceToken
    };
    
    deviceRegistrationService.createQueueIfNotExists('devices', function(error) { 
        if (!error) { 
            deviceRegistrationService.sendQueueMessage('devices', message, function(error) { 
                if (!error) { 
                    console.log('Sent message: ' + JSON.stringify(message)); 
                } 
            }); 
        } 
    }); 
        
   var devicesTable = tables.getTable('Devices');
   console.log(item.deviceToken);
   
   devicesTable.where({
       deviceToken: item.deviceToken
   }).read({
       success: insertTokenIfNotFound
   });

   function insertTokenIfNotFound(existingTokens) {
       console.log(JSON.stringify(existingTokens));
       
       if (existingTokens.length > 0) {
           request.respond(200, existingTokens[0]);
       } else {
           request.execute();
       }
   }
}