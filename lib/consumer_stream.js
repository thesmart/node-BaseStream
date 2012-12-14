var Stream = require('stream').Stream;
var util = require('util');

/**
 * a concrete, consumer (writable) stream that received data from upstream
 * @constructor
 * @extends {Stream}
 */
var ConsumerStream = function() {
	Stream.call(this);
	this.readable = false;
	this.writable = true;

	/**
	 * @type {Boolean}
	 * @private
	 */
	this._isPaused = false;

	/**
	 * @type {Boolean}
	 * @private
	 */
	this._isEnded = false;

	/**
	 * Stream is no longer writable nor readable. The stream will not emit any more 'data', or 'end' events.
	 * @type {Boolean}
	 * @private
	 */
	this._isClosed = false;

	/**
	 * Number of times data sent from upstream
	 * @type {Number}
	 */
	this.countUpstream = 0;
};
util.inherits(ConsumerStream, Stream);

/**
 * True if this stream is drained
 * @return {Boolean}
 * @protected
 */
ConsumerStream.prototype._isDrained = function() {
	return true;
};

/**
 * Called from an upstream data producer when it has produced data
 * @param {*} data
 * @return {Boolean}		True if everything is fine. False if upstream should pause.
 */
ConsumerStream.prototype.write = function(data) {
	if (this._isClosed) {
		this.emit(new Error('attempting to write to a closed stream'));
		return false;
	}

	++this.countUpstream;

	if (this._isDrained()) {
		this.emit('drain');
		if (this._isEnded) {
			this.emit('close');
		}
	}

	return !this._isPaused;
};

/**
 * Called from an upstream data producer when it will produce no more data
 */
ConsumerStream.prototype.end = function() {
	this._isEnded = true;
	this.destroySoon();
};

/**
 * Destroy the consumer stream immediately
 */
ConsumerStream.prototype.destroy = function() {
	this.emit('close');
	this._isClosed = true;
};

/**
 * Destroy the consumer stream after draining the buffer.
 */
ConsumerStream.prototype.destroySoon = function() {
	if (this._isDrained()) {
		// immediately
		this.destroy();
	} else {
		// once drained, destroy immediately
		this.once('drain', this.destroy.bind(this));
	}
};

module.exports = ConsumerStream;