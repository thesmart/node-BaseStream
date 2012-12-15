var Stream = require('stream').Stream;
var util = require('util');
var ConsumerStream = require('./consumer_stream.js');
var ProducerStream = require('./producer_stream.js');

/**
 * a concrete, bi-directional (readable & writable) stream that received data from upstream, and dispatches
 * data downstream.
 *
 * @constructor
 * @extends {Stream}
 */
var BiStream = function() {
	ConsumerStream.call(this);
	ProducerStream.call(this);

	this.readable = true;
	this.writable = true;

	/**
	 * Number of times data was handled
	 * @type {Number}
	 */
	this.countProcessed = 0;

	this.on('consumed', this._onConsumed.bind(this));
};
util.inherits(BiStream, Stream);

BiStream.prototype._produceData = ProducerStream.prototype._produceData;
BiStream.prototype.pause = ProducerStream.prototype.pause;
BiStream.prototype.resume = ProducerStream.prototype.resume;
BiStream.prototype.destroy = ProducerStream.prototype.destroy;

BiStream.prototype._isDrained = ConsumerStream.prototype._isDrained;
BiStream.prototype._consumeData = ConsumerStream.prototype._consumeData;
BiStream.prototype.write = ConsumerStream.prototype.write;
BiStream.prototype.end = ConsumerStream.prototype.end;
BiStream.prototype.destroy = ConsumerStream.prototype.destroy;
BiStream.prototype.destroySoon = ConsumerStream.prototype.destroySoon;

/**
* @param {*} result			Data to pass on downstream
* @private
*/
BiStream.prototype._onConsumed = function(result) {
	++this.countProcessed;
	this._produceData(result);
};

module.exports = BiStream;