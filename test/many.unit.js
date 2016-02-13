var RPC     = require('./../index');

module.exports = {
    setUp: function(callback) {
        this.data = '{"glossary": {"title": "example glossary","GlossDiv": {"title": "S","GlossList": {"GlossEntry": {"ID": "SGML","SortAs": "SGML","GlossTerm": "Standard Generalized Markup Language","Acronym": "SGML","Abbrev": "ISO 8879:1986","GlossDef": {"para": "A meta-markup language, used to create markup languages such as DocBook.","GlossSeeAlso": ["GML", "XML"]},"GlossSee": "markup"}}}}}';

        callback();
    },
    tearDown: function(callback) {
        callback();
    },
    testMany: function(test) {
        var self = this;

        //var number = Math.random();
        var start = new Date().getTime();
        var received = 0;
        var max = 10000;

        var receiver = RPC.create();
        receiver.connect();
        receiver.on('ready', function() {
            receiver.register('simpleCall', function(response) {
                //console.log('received');
                received++;

                if (received >= max) {
                    var now = new Date().getTime();
                    var delta = now - start;
                    console.log('processed 1000 calls in %d, #/sec: ', delta, delta / max * 1000);
                    test.done();
                }
                //test.ok(response === number, 'sent and received numbers match');
                //test.done();
            });

            var sender = RPC.create();
            sender.connect();
            sender.on('ready', function() {
                setInterval(function() {
                    sender.call('simpleCall', self.data, function(){});
                }, 1);

            });
        });
    }

}