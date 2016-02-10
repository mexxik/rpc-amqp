var RPC     = require('./lib/rpc');

module.exports = {
    create: function() {
        return new RPC();
    }
};