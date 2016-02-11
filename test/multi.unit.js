var async   = require('async');

var RPC     = require('./../index');

exports.group = {
    testMultiple: function(test) {
        var number = Math.random();

        var receiver1 = new RPC.create();
        var receiver2 = new RPC.create();
        var sender = new RPC.create();

        async.series([
            function(callback) {
                receiver1.connect();
                receiver1.on('ready', function() {
                    receiver1.register('multiCall', function (params, response) {
                        console.log('sender1');
                        response(1);

                        //test.ok(response === number, 'sent and received numbers match');
                        //test.done();
                    });

                    callback();
                });
            },
            function(callback) {
                receiver2.connect();
                receiver2.on('ready', function() {
                    receiver2.register('multiCall', function (params, response) {
                        console.log('sender2');
                        response(2);

                        //test.ok(response === number, 'sent and received numbers match');
                        //test.done();
                    });

                    callback();
                });
            },
            function(callback) {
                sender.connect();
                sender.on('ready', function() {
                    var result = 0;

                    sender.call('multiCall', {}, function(response){
                        console.log('got reply: %d', response);

                        result += response;
                        if (result === 3) {
                            console.log('test complete');
                            test.done();
                        }
                    });

                    callback();
                });
            }
        ], function(result) {

        });
    }
}