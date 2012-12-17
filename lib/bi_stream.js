var util = require('util');
var _ = require('underscore');
var AbstractStream = require('./abstract_stream.js');
var ConsumerStream = require('./consumer_stream.js');
var ProducerStream = require('./producer_stream.js');

/**
 * a concrete, bi-directional (readable & writable) stream that received data from upstream, and dispatches
 * data downstream.
 *
 * @param {String=} opt_name				Optional. Name for this stream
 * @param {Number=} opt_limitPending		Optional. Set a limit to the number of pending operations before signaling
 *
 * @constructor
 * @extends {Stream}
 */
var BiStream = function BiStream(opt_name, opt_limitPending) {
	ProducerStream.call(this, opt_name);
	ConsumerStream.call(this, opt_name, opt_limitPending);

	this.readable = true;
	this.writable = true;

	// traits
	_.each(ProducerStream.prototype, function(property, name) {
		if (_.isUndefined(BiStream.prototype[name])) {
			BiStream.prototype[name] = property;
		}
	});
	// traits
	_.each(ConsumerStream.prototype, function(property, name) {
		if (_.isUndefined(BiStream.prototype[name])) {
			BiStream.prototype[name] = property;
		}
	});

	/**
	 * Number of times data was handled
	 * @type {Number}
	 */
	this.countProcessed = 0;

	this.on('consumed', this._onConsumed.bind(this));
};
util.inherits(BiStream, AbstractStream);

/**
* @param {*} result			Data to pass on downstream
* @private
*/
BiStream.prototype._onConsumed = function(result) {
	++this.countProcessed;
	this.produce(result);
};

module.exports = BiStream;