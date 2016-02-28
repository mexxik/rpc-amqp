var async   = require('async');

var RPC     = require('./../index');

exports.group = {
    testCall: function(test) {
        var receiver1 = RPC.create();
        var receiver2 = RPC.create();
        var sender    = RPC.create();

        var value1    = 1;
        var value2    = 2;
        var result1   = 0;
        var result2   = 0;

        async.series([
            function(callback) {
                receiver1.connect({roles: ['r-1']});
                receiver1.on('ready', function() {
                    receiver1.register('getValue', function(params, response) {
                        response(value1);
                    });

                    callback();
                });
            },
            function(callback) {
                receiver2.connect({roles: ['r-2']});
                receiver2.on('ready', function() {
                    receiver2.register('getValue', function(params, response) {
                        response(value2);
                    });

                    callback();
                });
            },
            function(callback) {
                sender.connect();
                sender.on('ready', function() {
                    sender.call('getValue', {}, {route: '*.r-1.*'}, function(result) {
                        result1 = result;

                        callback();
                    });
                });
            },
            function(callback) {
                sender.call('getValue', {}, {route: '*.r-2.*'}, function(result) {
                    result2 = result;

                    callback();
                });
            },
            function(callback) {
                test.ok((value1 + value2) === (result1 + result2), 'the sum of requested and received values matched');

                callback();
            }
        ], function(err) {
            if (err) {
                console.log('series error');
            }
            else {
                test.done();
            }
        });
    }
}