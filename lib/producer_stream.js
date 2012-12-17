var util = require('util');
var AbstractStream = require('./abstract_stream.js');

/**
 * a concrete, producer (readable) stream that sends data downstream
 *
 * @param {String=} opt_name				Optional. Name for this stream
 *
 * @constructor
 * @extends {Stream}
 */
var ProducerStream = function ProducerStream(opt_name) {
	AbstractStream.call(this, opt_name);
	this.readable = true;
	this.writable = false;

	/**
	 * @type {Boolean}
	 * @private
	 */
	this._isPaused = false;

	/**
	 * Number of times data sent downstream
	 * @type {Number}
	 */
	this.countDownstream = 0;
};
util.inherits(ProducerStream, AbstractStream);

/**
 * Call to produce data
 * @param {*} data
 */
ProducerStream.prototype.produce = function(data) {
	if (this._isEnded || this._isClosed) {
		// ended, to not emit data
		return;
	}

	++this.countDownstream;
	this.emit('data', data);
};

/**
 * Pause the downstream production
 */
ProducerStream.prototype.pause = function() {
	this._isPaused = true;
	this.emit('pause');
};

/**
 * Resume the downstream production
 */
ProducerStream.prototype.resume = function() {
	this._isPaused = false;
	this.emit('resume');
};

/**
 * Destroy the producer stream
 */
ProducerStream.prototype.destroy = function() {
	if (this._isClosed) {
		// already destroyed
		return;
	}

	this._isClosed = true;
	process.nextTick(this.emit.bind(this, 'end'));
	process.nextTick(this.emit.bind(this, 'close'));
};

module.exports = ProducerStream;