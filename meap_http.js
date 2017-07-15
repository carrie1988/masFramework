/*!
 * superagent
 * Copyright (c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Stream = require('stream').Stream
  , formidable = require('meap_form')
  , Response = require('meap_http_response')
  , parse = require('url').parse
  , format = require('url').format
  , methods = require('meap_http_methods')
  , utils = require('meap_http_utils')
  , Part = require('meap_http_part')
  , mime = require('meap_http_mime')
  , https = require('https')
  , http = require('http')
  , fs = require('fs')
  , qs = require('querystring')
  , path = require("path")
  , util = require('util');

/**
 * Expose the request function.
 */

exports = module.exports = request;


/**
 * Expose `Part`.
 */

exports.Part = Part;

/**
 * Noop.
 */

function noop(){};

/**
 * Expose `Response`.
 */

exports.Response = Response;

/**
 * Define "form" mime type.
 */

mime.define({
  'application/x-www-form-urlencoded': ['form', 'urlencoded', 'form-data']
});

/**
 * Protocol map.
 */

exports.protocols = {
  'http:': http,
  'https:': https
};

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null != obj && 'object' == typeof obj;
}

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

exports.serialize = {
  'application/x-www-form-urlencoded': qs.stringify,
  'application/json': JSON.stringify
};

/**
 * Default parsers.
 *
 *     superagent.parse['application/xml'] = function(res, fn){
 *       fn(null, result);
 *     };
 *
 */

//exports.parse = require('./parsers');

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String|Object} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  if ('string' != typeof url) url = format(url);
  this.method = method;
  this.url = url;
  this.header = {};
  this.writable = true;
  this._redirects = 0;
  this.redirects(5);
  this.attachments = [];
  this.attachmentsize = 0;
  this.cookies = '';
  this._redirectList = [];
  this.on('end', this.clearTimeout.bind(this));
  this.on('response', function(res){
     self.callback(null, res);
  });
}

/**
 * Inherit from `Stream.prototype`.
 */

Request.prototype.__proto__ = Stream.prototype;

/**
 * Queue the given `file` as an attachment
 * with optional `filename`.
 *
 * @param {String} field
 * @param {String} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename, conType){
    var stat = null;
    try{
        stat= fs.statSync(file);
    }
    catch (e) {
        
    }

    var item = {
    field: field,
    value: file,
    filename: filename || path.basename(file),
	contenttype : conType?conType:"text/plain" ,
	type : stat?1:0
  };
  
  if(!this._boundary)
  		this._boundary = utils.uid(32);
  item.form = '--' + this._boundary + '\r\n';
  item.form += 'Content-Disposition: form-data; name="' + item.field + '"; filename="' + item.filename + '"\r\n';
  item.form += 'Content-Type: '+item.contenttype+'\r\n\r\n';
  this.attachments.push(item);
  var formBinary = new Buffer(item.form, 'utf-8');
  var rn = new Buffer("\r\n", 'utf-8');
  this.attachmentsize += formBinary.length + rn.length + (stat?stat.size:0);
  
  //LOG5("[SA] ATTACH ",item);
  return this;
};

/**
 * Set the max redirects to `n`.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.redirects = function(n){
  this._maxRedirects = n;
  return this;
};

/**
 * Return a new `Part` for this request.
 *
 * @return {Part}
 * @api public
 */

Request.prototype.part = function(){
  return new Part(this);
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this.request().setHeader(field, val);
  return this;
};

/**
 * Get request header `field`.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Request.prototype.get = function(field){
  return this.request().getHeader(field);
};

/**
 * Set _Content-Type_ response header passed through `mime.lookup()`.
 *
 * Examples:
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('json')
 *        .send(jsonstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/json')
 *        .send(jsonstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  return this.set('Content-Type', ~type.indexOf('/')
    ? type
    : mime.lookup(type));
};

/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.query = function(val){
  var req = this.request();
  if ('string' != typeof val) val = qs.stringify(val);
  if (!val.length) return this;
  req.path += (~req.path.indexOf('?') ? '&' : '?') + val;
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // string defaults to x-www-form-urlencoded
 *       request.post('/user')
 *         .send('name=tj')
 *         .send('foo=bar')
 *         .send('bar=baz')
 *         .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var req = this.request();
  var type = req.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  // string
  } else if ('string' == typeof data) {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = req.getHeader('Content-Type');

    // concat &
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;

  // default to json
  if (!type) this.type('json');
  return this;
};

/**
 * Write raw `data` / `encoding` to the socket.
 *
 * @param {Buffer|String} data
 * @param {String} encoding
 * @return {Boolean}
 * @api public
 */

Request.prototype.write = function(data, encoding){
  return this.request().write(data, encoding);
};

/**
 * Pipe the request body to `stream`.
 *
 * @param {Stream} stream
 * @param {Object} options
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.pipe = function(stream, options,callback){
  this.buffer(false);
  this.pipecb = callback;
  try{
     var r = this.end(function(err,res){});
	r.req.on('response', function(res){
      	//LOG5("[SA] PIPE RESPONSE ",res.statusCode);
		if(res.statusCode==200)
		{
		    if(res.headers['content-type'] && stream.setHeader)
           	    {
        	        stream.setHeader('content-type',res.headers['content-type']);
	            }
		    res.pipe(stream, options);
  		}
	});
  }
  catch(e)
  {
    callback(-1,e.message);
    return null; 
  }
};

/**
 * Enable / disable buffering.
 *
 * @return {Boolean} [val]
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.buffer = function(val){
  this._buffer = false === val
    ? false
    : true;
  return this;
};

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Define the parser to be used for this response.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.parse = function(fn){
  this._parser = fn;
  return this;
};

/**
 * Redirect to `url
 *
 * @param {IncomingMessage} res
 * @return {Request} for chaining
 * @api private
 */

Request.prototype.redirect = function(res,robot){
  //LOG5("[SA] REDIRECT TO ***************************",res.headers.location);
  var url = res.headers.location;

  if (!~url.indexOf('://')) {
    if(url[0]=='/' && 0 != url.indexOf('//')){
      url = this.protocol + '//' + this.host + url;
	}else if (0 != url.indexOf('//')) {
	  url = this.url.substring(0,this.url.lastIndexOf('/')+1) + url;
    }else{
	  url = this.protocol + url;
	}
  }

  delete this.req;
  this.method = 'HEAD' == this.method
    ? this.method
    : 'GET';
  this._data = null;
  this.url = url;
  this._redirectList.push(url);
  this.emit('redirect', res);
  var self = this;
  if(robot)
  {
    robot.attachCookie(this,function(err){
        self.end(self._callback,robot);
    });
  }
  else
      this.end(this._callback,robot);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = new Buffer(user + ':' + pass).toString('base64');
  return this.set('Authorization', 'Basic ' + str);
};
Request.prototype.ca = function(p12,pass)
{
	this.CAuth = true;
	this.PKCS12 = fs.readFileSync(p12);
	this.PassPhrase = pass;
}
Request.prototype.agent = function(mAgent)
{
	this.agent = mAgent;
}
/**
 * Write the field `name` and `val`.
 *
 * @param {String} name
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  var item = {
    field: name,
    value: val,
	type : 0
  };
  if(!this._boundary)
  		this._boundary = utils.uid(32);
  item.form = '--' + this._boundary + '\r\n';
  item.form += 'Content-Disposition: form-data; name="' + item.field + '"\r\n\r\n';
  item.form += item.value + '\r\n';
  this.attachments.push(item);
  var contentBinary = new Buffer(item.form, 'utf-8');
  this.attachmentsize += contentBinary.length;
  
  //LOG5("[SA] FIELD ",item);
  return this;
};

/**
 * Return an http[s] request.
 *
 * @return {OutgoingMessage}
 * @api private
 */

Request.prototype.request = function(){
  if (this.req) return this.req;
  var self = this
    , options = {}
    , data = this._data
    , url = this.url;

  // default to http://
  if (0 != url.indexOf('http')) url = 'http://' + url;
  url = parse(url, true);

  // options
  options.method = this.method;
  options.port = url.port;
  options.path = url.path;
  options.host = url.hostname;
  if(this.agent == false)
  {
    options.agent = this.agent;
  }
  if(this.CAuth)
  {
    options.pfx = this.PKCS12;
    options.passphrase = this.PassPhrase; 
  }
  // initiate request
  var mod = exports.protocols[url.protocol];

  // request
  var req = this.req = mod.request(options);
  if(this.agent != false)
  {
	  req.setSocketKeepAlive(true,15000);
  }
  this.protocol = url.protocol;
  this.host = url.host;

  // expose events
  req.on('drain', function(){ self.emit('drain'); });

  req.on('error', function(err){
    // flag abortion here for out timeouts
    // because node will emit a faux-error "socket hang up"
    // when request is aborted before a connection is made
    if (self._aborted) return;
    if(self.pipecb)
       self.pipecb(-1,err);
    else 
       self.callback(err);
  });

  // auth
  if (url.auth) {
    var auth = url.auth.split(':');
    this.auth(auth[0], auth[1]);
  }

  // query
  //this.query(url.query);

  // add cookies
  req.setHeader('Cookie', this.cookies);

  return req;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Initiate request, invoking callback `fn(err, res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn,robot){
  var self = this
    , data = this._data
    , req = this.request()
    , buffer = this._buffer
    , method = this.method
    , timeout = this._timeout;

  // store callback
  this._callback = fn || noop;
  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      var err = new Error('timeout of ' + timeout + 'ms exceeded');
      err.timeout = timeout;
      self._aborted = true;
      req.abort();
      self.callback(err);
    }, timeout);
  }

    if(this._Headers){
      for(var hindex in this._Headers)
      {
        this.set(hindex,this._Headers[hindex]);
      }
    }

  // body
  if ('HEAD' != method && !req._headerSent) {
    // serialize stuff
    if ('string' != typeof data) {
      var serialize = exports.serialize[req.getHeader('Content-Type')];
      if (serialize) data = serialize(data);
    }

    // content-length
    if (data && !req.getHeader('Content-Length')) {
      this.set('Content-Length', Buffer.byteLength(data));
    }
  }
  // response
  req.on('response', function(res){

    var max = self._maxRedirects
      , mime = utils.type(res.headers['content-type'] || '')
      , type = mime.split('/')
      , subtype = type[1]
      , type = type[0]
      , multipart = 'multipart' == type
      , redirect = isRedirect(res.statusCode);


    //self.Agent.saveCookies(res);
    if(robot && res.headers['set-cookie'])
	robot.saveCookie({res:res,header:res.headers,headers:res.headers});
    // redirect
    if (redirect && self._redirects++ != max && max>0) {
      return self.redirect(res,robot);
    }

    // zlib support
    if (/^(deflate|gzip)$/.test(res.headers['content-encoding'])) {
      utils.unzip(req, res);
    }

    // don't buffer multipart
    if (multipart) buffer = false;

    // TODO: make all parsers take callbacks
    if (multipart) {
      var form = new formidable.IncomingForm;

      form.parse(res, function(err, fields, files){
        if (err) throw err;
        // TODO: handle error
        // TODO: emit formidable events, parse json etc
        var response = new Response(req, res);
        response.body = fields;
        response.files = files;
        response.redirects = self._redirectList;
        self.emit('end');
        self.callback(null, response);
      });
      return;
    }

    // by default only buffer text/*, json
    // and messed up thing from hell
    var text = isText(mime);
    if (null == buffer && text) buffer = true;

    // parser
	//We only use buffer parse set by MEAP.AJAX. So that we not use parse modules.
    var parse = null;
	/*var parse = 'text' == type
      ? exports.parse.text
      : exports.parse[mime];

    // buffered response
    if (buffer) parse = parse || exports.parse.text;
    */ 
    // explicit parser
    if (self._parser) parse = self._parser;

    // parse
    if (parse) {
      parse(res, function(err, obj){
        // TODO: handle error
        res.body = obj;
      });
    }

    // unbuffered
    
    if (!buffer) {
        self.res = res;
        var response = new Response(self.req, self.res);
        response.redirects = self._redirectList;
        self.emit('response', response);
        res.on("end", function(){
            if (self.pipecb) 
                self.pipecb((res.statusCode==200)?null:-1, response);
        });
        return;
    }

    // end event
    self.res = res;
    res.on('end', function(){
      // TODO: unless buffering emit earlier to stream
      var response = new Response(self.req, self.res);
      response.redirects = self._redirectList;
      self.emit('response', response);
      self.emit('end');
    });
  });

  if (this.attachments.length) {
  	this.writeAttachments();
  	return this;
  }

  // multi-part boundary
  //delete this line. Because mutipart upload for field and attach use same code - writeAttachments.
  //if (this._boundary) this.writeFinalBoundary();

  req.end(data);
  return this;
};

/**
 * Write the final boundary.
 *
 * @api private
 */
// No use. Deleted
//Request.prototype.writeFinalBoundary = function(){
//  this.request().write('\r\n--' + this._boundary + '--');
//};

/**
 * Write the attachments in sequence.
 *
 * @api private
 */
Request.prototype.writeAttachments = function(){
	/*
	 * create this.req._boundary
	 * 
	 * 
	 * */ 
  //LOG5("[SA] BEGIN SEND ATTACHS"); 	
  var items = this.attachments
    , req = this.request()
    , self = this
	,MULTIPART_END = '--' + this._boundary + '--\r\n'
	,length = this.attachmentsize + new Buffer(MULTIPART_END, "utf-8").length;

  self.set('Content-Type', 'multipart/form-data; boundary=' + this._boundary);
  self.set('Content-Length',length);
  
  //LOG5("[SA] ATTACHMENTSIZE ",length); 	
  function next() {
    var item = items.shift();
    if (!item) {
	  //LOG5("[SA] SEND ATTACH END ");
	  req.write(MULTIPART_END);
      return req.end();
    }
	//LOG5("[SA] SEND ATTACH item ",item.field,item.value);
	req.write(item.form);
	if (item.type == 1) {
		var stream = fs.createReadStream(item.value, {bufferSize : 4 * 1024});
		// TODO: pipe
		// TODO: handle errors
		stream.pipe(req, {end: false});
		stream.on('error', function(err){
			//LOG5("[SA] SEND ATTACH FILE ERROR ",err);
			self.emit('error', err);
		});
		stream.on('end', function(){
			//LOG5("[SA] SEND ATTACH FILE END ",item.value);
			req.write('\r\n');
			next();
		});
	}
	else
		next();
  }

  next();
};

/**
 * Expose `Request`.
 */

exports.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

// generate HTTP verb methods

methods.forEach(function(method){
  var name = 'delete' == method
    ? 'del'
    : method;

  method = method.toUpperCase();
  request[name] = function(url, fn){
    var req = request(method, url);
    fn && req.end(fn);
    return req;
  };
});

/**
 * Check if `mime` is text and should be buffered.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api public
 */

function isText(mime) {
  var parts = mime.split('/');
  var type = parts[0];
  var subtype = parts[1];

  return 'text' == type
    || 'json' == subtype
    || 'x-www-form-urlencoded' == subtype;
}

/**
 * Check if we should follow the redirect `code`.
 *
 * @param {Number} code
 * @return {Boolean}
 * @api private
 */

function isRedirect(code) {
  return ~[301, 302, 303, 305, 307].indexOf(code);
}
