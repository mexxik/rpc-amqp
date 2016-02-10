var RPC     = require('./../index');

exports.group = {
    testCall: function(test) {
        var number = Math.random();

        var receiver = RPC.create();
        receiver.connect();
        receiver.on('ready', function() {
            receiver.register('simpleCall', function(response) {
                test.ok(response === number, 'sent and received numbers match');
                test.done();
            });

            var sender = RPC.create();
            sender.connect();
            sender.on('ready', function() {
                sender.call('simpleCall', number, function(){});
            });
        });
        //test.done();
    }
}