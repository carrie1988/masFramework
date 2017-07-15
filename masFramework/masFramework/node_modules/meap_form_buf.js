if (global.GENTLY) require = GENTLY.hijack(require);

// This is a buffering parser, not quite as nice as the multipart one.
// If I find time I'll rewrite this to be fully streaming as well
var querystring = require('querystring');
var BUF = require("buffer");

function BufferParser() {
  this.buffer = [];
};
exports.BufferParser = BufferParser;

BufferParser.prototype.write = function(buffer) {
  this.buffer.push(buffer);
  return buffer.length;
};

BufferParser.prototype.end = function() {
  this.onBody(BUF.Buffer.concat(this.buffer));
  this.buffer = '';
  this.onEnd();
};

BufferParser.prototype.cancel = function() {
    this.buffer = [];
};