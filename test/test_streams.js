// for testing, use http://visionmedia.github.com/mocha/

var streams = require('../index.js');
var assert = require('assert');

describe('Produce and Consumer', function() {
	it('write through', function(done) {
		var p = new streams.ProducerStream();
		var c = new streams.ConsumerStream();
		p.pipe(c);

		c.on('drain', function() {
			assert.equal(1, p.countDownstream);
			assert.equal(1, c.countUpstream);
		});

		c.on('close', function() {
			done();
		});

		p._onData('hello world');
		p.destroy();
	});

	it('destroySoon', function(done) {
		var p = new streams.ProducerStream();
		var c = new streams.ConsumerStream();
		p.pipe(c);

		var isClosed = false;
		p.on('close', function() {
			isClosed = true;
		});

		c.on('drain', function() {
			assert.equal(0, p.countDownstream);
			assert.equal(0, c.countUpstream);
		});

		c.on('close', function() {
			process.nextTick(function() {
				assert.ok(isClosed);
				done();
			});
		});

		p.destroy();
	});
});