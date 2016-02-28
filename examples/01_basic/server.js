var RPC = require('./../../index');
var server = RPC.create();

server.connect();

server.on('ready', function() {
    server.register('getRandomNumber', function (params, response) {
        var number = Math.random();

        response(number);
    });
});
