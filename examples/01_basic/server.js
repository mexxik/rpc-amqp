var RPC = require('./../../index');
var client = RPC.create();

client.connect();

client.on('ready', function() {
    client.register('getRandomNumber', function (params, response) {
        var number = Math.random();

        response(number);
    });
});
