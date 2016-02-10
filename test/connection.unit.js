var RPC     = require('./../index');

exports.group = {
    setUp: function(callback) {
        this.rpc = RPC.create();

        callback();
    },
    tearDown: function(callback) {
        this.rpc.close();
        callback();
    },
    testReadyDefaultParams: function(test) {
        this.rpc.connect();
        this.rpc.on('ready', function() {
            test.done();
        });
    },
    testReadyCustomParams: function(test) {
        this.rpc.connect({
            host: 'localhost',
            port: 5672,
            username: 'guest',
            password: 'guest'
        });
        this.rpc.on('ready', function() {
            test.done();
        });
    },
    testConnectionError: function(test) {
        this.rpc.connect({
            host: 'localhost',
            port: 80,
            username: 'guest',
            password: 'guest'
        });
        this.rpc.on('error', function() {
            test.done();
        });
    }/*,
    testAuthenticationError: function(test) {
        this.rpc.connect({
            host: 'localhost',
            port: 5672,
            username: 'username',
            password: 'password'
        });
        this.rpc.on('error', function() {
            test.done();
        });
    }*/
}