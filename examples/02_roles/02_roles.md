#Example 02: Roles

This example introduces 2 servers that register the same RPC `getValue` but each of them return different result. 
A client is able to retrieve from each server individually based on a `role` using `routing`.

First start `node server1` and `node server2` then the client: `node client`.
 

##Server 1

```javascript
var RPC = require('rpc-amqp');
var server = RPC.create();

server.connect({roles: ['server-1']});

server.on('ready', function() {
    server.register('getValue', function (params, response) {
        response(1);
    });
});
```

##Server 2

```javascript
var RPC = require('rpc-amqp');
var server = RPC.create();

server.connect({roles: ['server-2']});

server.on('ready', function() {
    server.register('getValue', function (params, response) {
        response(2);
    });
});
```

##Client

```javascript
var async = require('async');

var RPC = require('rpc-amqp');
var client = RPC.create();

client.connect();

client.on('ready', function() {
    var result1 = 0;
    var result2 = 0;

    async.series([
        function(callback) {
            client.call('getValue', {}, { route: '*.server-1.*'}, function(result) {
                result1 = result;

                callback();
            });
        },
        function(callback) {
            client.call('getValue', {}, { route: '*.server-2.*'}, function(result) {
                result2 = result;

                callback();
            });
        },
        function(callback) {
            console.log('result 1: "%d", result 2: "%d"', result1, result2);

            callback();
        }
    ], function(err) {
        if (err) {
            console.log('async error');
        }
    });
});
```