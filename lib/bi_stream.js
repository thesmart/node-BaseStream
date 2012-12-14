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
};
util.inherits(BiStream, Stream);

BiStream.prototype._produceData = ProducerStream.prototype._produceData;
BiStream.prototype.pause = ProducerStream.prototype.pause;
BiStream.prototype.resume = ProducerStream.prototype.resume;
BiStream.prototype.destroy = ProducerStream.prototype.destroy;

BiStream.prototype._isDrained = ConsumerStream.prototype._isDrained;
BiStream.prototype.write = ConsumerStream.prototype.write;
BiStream.prototype.end = ConsumerStream.prototype.end;
BiStream.prototype.destroy = ConsumerStream.prototype.destroy;
BiStream.prototype.destroySoon = ConsumerStream.prototype.destroySoon;

/**
* Handle upstream data before sending it back downstream.
* Overload this method if you want to handle data.
*
* @param {*} data			Data to consume.
* @param {Function} cb		Standard node callback(err, result) when consumption has completed.
* @private
*/
BiStream.prototype._handleData = function(data, cb) {
	cb(null, data);
};

BiStream.prototype._consumeData = function(data, cb) {
	// give the implementer a way to manipulate the data
	this._handleData(data, function(err, result) {
		// we're done consuming data
		++this.countProcessed;
		this._produceData(result);
		cb(null, result);
	}.bind(this));
};

module.exports = BiStream;