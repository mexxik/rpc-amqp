var RPC = require('./../../index');
var client = RPC.create();

client.connect();

client.on('ready', function() {
    client.call('getRandomNumber', {}, {}, function(result){
        console.log(result);
    });
});
