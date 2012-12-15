node-BaseStream
===================

Middleware for Node.js Streams.  Creating your own is easy:

```javascript
var fs = require('fs');
var bs = require('base-stream');

// open some file streams
var readStream = fs.createReadStream('./input.txt', { encoding: 'utf8' });
var writeStream = fs.createWriteStream('./output.txt');

// create your own stream middle-ware
var lowerCaseStream = new bs.BiStream(); // bi-directional stream
lowerCaseStream.setDataHandler(function(data, cb) {
	var result = data.toLowerCase();
	cb(null, result);
});

// lay some pipe, Tex!
readStream.pipe(lowerCaseStream);
lowerCaseStream.pipe(writeStream);
```

Ever have a producer (e.g. database) that is too fast for the consumer (e.g. http api)?  Streams solve this problem!

```javascript
// when slowStream hits 1,000 concurrent operations, it will ask fastStream to pause.
// when slowStream completes the operations, it will ask fastStream to resume.
var slowStream = new bs.BiStream(1000);
fastStream.pipe(slowStream);
```
