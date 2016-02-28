# rpc-amqp

node.js library for cross-application communication via amqp.

#Setup

Install the dependency:

`npm install rpc-amqp`

Require it in your application:

```javascript
var RPC = require('rpc-amqp');
```


#Usage

To make the library working you need to have a default installation of RabbitMQ message broker: https://www.rabbitmq.com/download.html

##Client

Create a client object to send and receive RPCs (multiple objects could be created within the same scope):

```javascript
var client = RPC.create();
```

##Connection

You can establish a connection to a default `localhost` with `guest:guest` credentials:

```javascript
client.connect();
```
Or customize your connection with parameters:

```javascript
client.connect({
    host: 'localhost',
    port: 5672,
    username: 'guest',
    password: 'guest'
});
```

##Ready

When the library connects to the broker and makes all preparations it emits `ready` event. At this point you can start registering callbacks and send RPCs:

```javascript
client.on('ready', function() {
    // messages sending and callbacks registration here
});
```

##Workflow

The workflow consists of sending, receiving and returning the result:

- to send a call you invoke `call` method on your client.
- to receive a call you implement a callback function with client's `register`.
- to return a result you pass a result object to callback function in `register`.

###client.call(name[,params][,options][,callback])

Makes a call with specified `params` and `options`. If there is a callback registered in the system the `callback` with a result will be returned.

- `name`: name of the call that should be invoked remotely.
- `params`: parameters of the call that will be passed to the remote consumer.
- `options`: options that define the behaviour (like roles and routes) of the call. Allow to customize the call and 
- `callback`: callback function that will be invoked when the remote consumer replies with a result.

Here is an example of `client.call` usage:

```javascript
sender.call('getRandomNumber', {}, {}, function(result){
    console.log(result);
});
```

###client.register(name[, callback])

Registers an RPC by a specified `name`. You can return a result object to the sender by calling `callback`.

- `name`: name of the call that the client should reply to.
- `callback`: function that could be called in if you want to reply with a result.

Here is an example of `client.register` that can listen to the `call` sent in the previous example (`getRandomNumber`):

```javascript
client.register('getRandomNumber', function (params, response) {
    var number = Math.random();

    response(number);
});
```

#Routing

##Path

##ID

##Roles

#Examples

[01 Basic - Random Number](examples/01_basic/01_basic.md)

[02 Roles - Multiple Servers](examples/02_roles/02_roles.md)