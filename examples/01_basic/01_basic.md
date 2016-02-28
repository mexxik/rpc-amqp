#Example 01: Random Number

This example show a simple set up that allows to request a random number from a remote application.

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

#Examples
[01 Basic - Random Number](examples/01_basic/01_basic.md)