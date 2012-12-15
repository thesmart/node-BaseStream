var Stream = require('stream').Stream;
var util = require('util');

/**
 * a concrete, consumer (writable) stream that received data from upstream
 *
 * @param {Number=} opt_limitPending		Optional. Set a limit to the number of pending operations before signaling
 *
 * @constructor
 * @extends {Stream}
 */
var ConsumerStream = function(opt_limitPending) {
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
	 * Limit the number of outstanding pending operations by request pause upstream
	 * @type {Number}
	 * @private
	 */
	this._limitPending = opt_limitPending || undefined;

	/**
	 * Number of times data sent from upstream
	 * @type {Number}
	 */
	this.countUpstream = 0;

	/**
	 * Count the number of pending data items needing processing
	 * @type {Number}
	 */
	this.countPending = 0;
};
util.inherits(ConsumerStream, Stream);

/**
 * True if this stream is drained
 * @return {Boolean}
 * @protected
 */
ConsumerStream.prototype._isDrained = function() {
	return this.countPending === 0;
};

/**
 * Overload this method when you want to consume data
 * @param {*} data			Data to consume.
 * @param {Function} cb		Standard node callback(err, result) when consumption has completed.
 * @protected
 */
ConsumerStream.prototype._consumeData = function(data, cb) {
	cb(null, data);
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
	++this.countPending;

	var self = this;
	this._consumeData(data, function(err, result) {
		--self.countPending;

		if (err) {
			self.emit('error', err);
		} else {
			self.emit('consumed', result);
		}

		if (self._isDrained()) {
			self.emit('drain');
		}
	});

	if (this._isPaused) {
		// pause upstream
		return false;
	} else if (this._limitPending && this.countPending >= this._limitPending) {
		return false;
	}

	return true;
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