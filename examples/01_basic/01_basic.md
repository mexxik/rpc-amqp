#Example 01: Random Number

This example show a simple set up that allows to request a random number from a remote application.

Start the server with `node server` then th client `node client`.

##Server

```javascript
var RPC = require('rpc-amqp');
var server = RPC.create();

server.connect();
server.on('ready', function() {
    server.register('getRandomNumber', function (params, response) {
        var number = Math.random();
    
        response(number);
    });
});
```

##Client

```javascript
var RPC = require('rpc-amqp');
var client = RPC.create();

client.connect();
client.on('ready', function() {
    client.call('getRandomNumber', {}, {}, function(result){
        console.log(result);
    });
});
```