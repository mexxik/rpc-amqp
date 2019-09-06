var async = require('async');

var RPC = require('./../../index');
var client = RPC.create();

client.connect();

client.on('ready', function() {
    var result1 = 0;
    var result2 = 0;

    async.series([
        function(callback) {
            client.call('getValue', {}, { route: 'app.#'}, function(result) {
                result1 = result;

                callback();
            });
        }
        /*function(callback) {
            client.call('getValue', {}, { route: '*.server-2.*'}, function(result) {
                result2 = result;

                callback();
            });
        },*/
        /*function(callback) {
            console.log('result 1: "%d", result 2: "%d"', result1, result2);

            callback();
        }*/
    ], function(err) {
        if (err) {
            console.log('async error');
        }
    });
});
