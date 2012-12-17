// for testing, use http://visionmedia.github.com/mocha/

var streams = require('../index.js');
var assert = require('assert');
var util = require('util');

describe('Produce and Consumer', function() {
	it('forEach', function() {
		var p = new streams.ProducerStream();
		var b = new streams.BiStream();
		var c = new streams.ConsumerStream();

		p.pipe(b).pipe(c);

		var order = [];
		p.forEach(function(stream, name) {
			order.push(name);
		});

		assert.deepEqual(["ProducerStream","BiStream","ConsumerStream"], order);
	});

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

		var p = new streams.ProducerStream('Stream-P');
		var c = new streams.ConsumerStream('Stream-C', 1);
		c.setMiddleware(function(data, cb) {
			global.setTimeout(cb.bind(this, null, data), 1000);
		});
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

	it('filter', function() {
		var p = new streams.ProducerStream();
		var b = new streams.BiStream();
		b.setMiddleware(function(data, cb) {
			cb(null, data % 2 !== 0 ? undefined : data);
		});
		p.pipe(b);

		b.on('data', function(data) {
			assert.ok(data % 2 === 0);
		});

		for (var i = 0; i < 10; ++i) {
			p._produceData(i);
		}
	});
});