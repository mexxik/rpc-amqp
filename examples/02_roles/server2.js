var RPC = require('./../../index');
var server = RPC.create();

server.connect({roles: ['server-2']});

server.on('ready', function() {
    server.register('getValue', function (params, response) {
        response(2);
    });
});
