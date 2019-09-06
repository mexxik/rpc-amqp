var RPC = require('./../../index');
var server = RPC.create();

server.connect({roles: ['server-1']});

server.on('ready', function() {
    server.register('getValue', function (params, response) {
        console.log("live got")
        response(1);
    });
});
