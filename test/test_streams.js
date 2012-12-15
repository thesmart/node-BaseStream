// for testing, use http://visionmedia.github.com/mocha/

var streams = require('../index.js');
var assert = require('assert');
var util = require('util');

var SlowStream = function() {
	streams.ConsumerStream.apply(this, arguments);
};
util.inherits(SlowStream, streams.ConsumerStream);

SlowStream.prototype._consumeData = function(data, cb) {
	global.setTimeout(cb, 1000);
};

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

		p._produceData('hello world');
		p.destroy();
	});

	it('limits', function(done) {

		var p = new streams.ProducerStream();
		var c = new SlowStream(1);
		p.pipe(c);

		var wasPaused = false;
		p.on('pause', function() {
			wasPaused = true;
		});

		var wasDrained = false;
		c.on('drain', function() {
			wasDrained = true;
		});

		c.on('close', function() {
			assert.ok(wasPaused, 'producer was not paused by slow consumer');
			assert.ok(wasDrained, 'consumer never drained');
			done();
		});

		p._produceData('hello world');
		c.destroySoon();
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

	it('three stages', function(done) {
		var p = new streams.ProducerStream();
		var b = new streams.BiStream();
		var c = new streams.ConsumerStream();

		var pData = false;
		p.on('data', function() {
			pData = true;
		});

		var bData = false;
		b.on('data', function() {
			assert.ok(pData, 'producer must first produce data');
			bData = true;
		});

		p.pipe(b);
		b.pipe(c);

		var cDrain = false;
		c.on('drain', function() {
			cDrain = true;
			assert.equal(1, p.countDownstream);
			assert.equal(1, c.countUpstream);
			assert.equal(1, b.countDownstream);
			assert.equal(1, b.countUpstream);
		});

		c.on('close', function() {
			assert.ok(cDrain, 'consumer never drained before closing');
			assert.ok(pData, 'producer did not produce data');
			assert.ok(bData, 'bi-directional did not produce data');
			assert.equal(1, b.countProcessed);
			done();
		});

		p._produceData('hello world');
		p.destroy();
	});
});