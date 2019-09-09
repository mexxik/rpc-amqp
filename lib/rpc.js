var EventEmitter    = require('events').EventEmitter;
var utils           = require('util');

var async           = require('async');

var net             = require('net');
var bramqp          = require('bramqp');
var uuid            = require('node-uuid');

var logger          = require('winston');


var RPC = module.exports = function RPC() {
    this.registeredCallbacks = {};
    this.rpcCallbacks = {};
    this.rpcTimeouts = {};
    this.rpcGathers = {};
    this.exchangeName = '';
    this.id = uuid.v4();
    this.queueName = '';
};

utils.inherits(RPC, EventEmitter);

RPC.prototype.connect = function(params) {
    var self = this;

    if (!params) {
        params = {};
    }

    self.host = params.host ? params.host : 'localhost';
    self.port = params.port ? params.port : 5672;
    self.username = params.username ? params.username : 'guest';
    self.password = params.password ? params.password : 'guest';
    self.application = params.application ? params.application : 'app';
    self.roles = params.roles ? params.roles : ['role'];

    self.exchangeName = self.application + '.rpc';
    self.queueName = self.application + '.' + self.id;

    self.socket = net.connect({
        host: self.host,
        port: self.port
    });

    self.socket.on('error', function(err) {
        self.emit('error', err);
    });

    bramqp.initialize(self.socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(error, handle) {
        if (error) {
            logger.error('amqp error');
        }
        else {
            logger.debug('amqp connected');

            self.handle = handle;

            handle.on('error', function(err) {
                self.emit('error', err);
            });

            async.series([
                function(callback) {
                    logger.debug('authenticating amqp');

                    handle.openAMQPCommunication(self.username, self.password, true, callback);
                },
                function(callback) {
                    logger.debug('declaring exchange');

                    handle.exchange.declare(1, self.exchangeName, 'topic', false, true, false, false, false, {});
                    handle.once('1:exchange.declare-ok', function(channel, method, data) {
                        logger.debug('exchange declared');

                        callback();
                    });
                },
                function(callback) {
                    logger.debug('declaring queue');

                    handle.queue.declare(1, self.queueName, false, false, false, true, false, {});
                    handle.once('1:queue.declare-ok', function(channel, method, data) {
                        logger.debug('queue declared: %s', data.queue);

                        self.queueName = data.queue;

                        callback();
                    });
                },
                function(callback) {
                    logger.debug('binding queue');
                    var bindingFunctions = [];

                    bindingFunctions.push(function(bindingCallback) {
                        var bindingKey = self.application + '.#';

                        handle.queue.bind(1, self.queueName, self.exchangeName, bindingKey, false, {});
                        handle.once('1:queue.bind-ok', function(channel, method, data) {
                            logger.debug('queue bound to: %s', bindingKey);

                            bindingCallback();
                        });
                    });
                    self.roles.forEach(function(role) {
                        bindingFunctions.push(function(bindingCallback) {
                            var bindingKey = '*.' + role + '.*';

                            handle.queue.bind(1, self.queueName, self.exchangeName, bindingKey, false, {});
                            handle.once('1:queue.bind-ok', function(channel, method, data) {
                                logger.debug('queue bound to: %s', bindingKey);

                                bindingCallback();
                            });
                        });
                    });
                    bindingFunctions.push(function(bindingCallback) {
                        var bindingKey = '#.' + self.id;

                        handle.queue.bind(1, self.queueName, self.exchangeName, bindingKey, false, {});
                        handle.once('1:queue.bind-ok', function(channel, method, data) {
                            logger.debug('queue bound to: %s', bindingKey);

                            bindingCallback();
                        });
                    });

                    async.parallel(bindingFunctions, function(err, result) {
                        callback();
                    });
                },
                function(callback) {
                    handle.basic.consume(1, self.queueName, null, false, true, false, false, {});
                    handle.once('1:basic.consume-ok', function(channel, method, data) {
                        logger.debug('consuming messages');

                        handle.on('1:basic.deliver', function(channel, method, data) {
                            handle.once('content', function(channel, className, properties, content) {
                                //self.processMessage(content.toString());
                                var message = JSON.parse(content.toString());
                                if (message.type === 'response') {
                                    var correlationId = properties['correlation-id'];

                                    if (self.rpcGathers.hasOwnProperty(correlationId)) {
                                        if (message.params.hasOwnProperty('result')) {
                                            self.rpcGathers[correlationId].result = self.rpcGathers[correlationId].result.concat(message.params['result']);
                                        }
                                        else {
                                            self.rpcGathers[correlationId]['result'].push(message.params);
                                        }
                                    }
                                    else {
                                        if (self.rpcTimeouts.hasOwnProperty(correlationId)) {
                                            clearTimeout(self.rpcTimeouts[correlationId]);
                                            delete self.rpcTimeouts[correlationId];
                                        }

                                        if (self.rpcCallbacks.hasOwnProperty(correlationId)) {
                                            var rpcCallback = self.rpcCallbacks[correlationId];
                                            rpcCallback.call(self, message.params);
                                        }
                                    }
                                }
                                else {
                                    logger.debug('rpc request message');

                                    if (self.registeredCallbacks.hasOwnProperty(message.name)) {
                                        self.registeredCallbacks[message.name].call(self, message.params, function(response) {
                                            var responseMessage = {
                                                name: message.name,
                                                type: "response",
                                                params: response
                                            };

                                            handle.basic.publish(1, self.exchangeName, properties['reply-to'], false, false, function() {
                                                handle.content(1, 'basic', {
                                                    'correlation-id' : properties['correlation-id']
                                                }, JSON.stringify(responseMessage), function() {
                                                    //handle.basic.ack(1, data['delivery-tag']);
                                                });
                                            });
                                        });
                                    }
                                }
                            });
                        });

                        callback();
                    });


                }
            ], function(err) {
                if (err) {
                    logger.error('series error');
                }
                else {
                    logger.debug('amqp initialization complete');

                    self.emit('ready');
                }
            });
        }
    });
};

RPC.prototype.close = function() {
    if (this.socket) {
        this.socket.end();
    }
};

RPC.prototype.call = function(name, params, options, callback) {
    var self = this;

    var args = [];
    for (var a = 0; a < arguments.length; a++) {
        args.push(arguments[a]);
    }

    name = args.shift();
    if (typeof args[args.length-1] === 'function') {
        callback = args.pop();
    }


    if (args.length > 0) {
        params = args.shift();
    }
    else {
        params = null;
    }

    if (args.length > 0) {
        options = args.shift();
    }
    else {
        options = {
            route: self.application + '.#'
        }
    }

    if (!options.route) {
        options.route = self.application + '.#';
    }
    if (!options.timeout) {
        options.timeout = options.gather ? 1000 : 0;
    }

    var message = {
        name: name,
        params: params,
        type: 'request'
    };

    var correlationId = uuid.v4();
    if (options.gather) {
        self.rpcGathers[correlationId] = {
            'result': [],
            'callback': callback
        }
    }
    else {
        self.rpcCallbacks[correlationId] = callback;
    }

    self.handle.basic.publish(1, self.exchangeName, options.route, false, false, function() {
        self.handle.content(1, 'basic', {
            'reply-to': self.queueName,
            'correlation-id': correlationId
        }, JSON.stringify(message), function() {
            logger.debug('rpc sent');
        });
    });

    if (options.timeout) {
        self.rpcTimeouts[correlationId] = setTimeout(function() {
            if (options.gather) {
                var rpcCallback = self.rpcGathers[correlationId]['callback'];
                rpcCallback.call(self, self.rpcGathers[correlationId]['result']);

                clearTimeout(self.rpcTimeouts[correlationId]);
                delete self.rpcGathers[correlationId];
            }
            else {
                if (self.rpcCallbacks.hasOwnProperty(correlationId)) {
                    var rpcCallback = self.rpcCallbacks[correlationId];
                    rpcCallback.call(self, {});

                    clearTimeout(self.rpcTimeouts[correlationId]);
                    delete self.rpcTimeouts[correlationId];
                }
            }
        }, options.timeout);
    }
};

RPC.prototype.register = function(name, callback) {
    this.registeredCallbacks[name] = callback;
};