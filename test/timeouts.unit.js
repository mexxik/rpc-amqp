var RPC     = require('./../index');

exports.group = {
    testCall: function(test) {
        var number = Math.random();

        var receiver = RPC.create();
        receiver.connect();
        receiver.on('ready', function() {
            /*receiver.register('simpleCall', function(params, callback) {
                callback();
            });*/

            var sender = RPC.create();
            sender.connect();
            sender.on('ready', function() {
                console.log('2');

                sender.call('simpleCall', number, {timeout: 2000}, function(response){
                    test.done();
                });
            });
        });
    }
}

