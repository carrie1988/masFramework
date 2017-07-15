/*
 * Copyright (c) 2011 Vinay Pulim <vinay@milewise.com>
 * MIT Licensed
 */

"use strict";

function findKey(obj, val) {
  for (var n in obj)
    if (obj[n] === val)
      return n;
}

var http = require('meap_soap_http'),
  assert = require('assert'),
  url = require('url');

var Client = function(wsdl, endpoint) {
  this.wsdl = wsdl;
  this._initializeServices(endpoint);
};

Client.prototype.addSoapHeader = function(soapHeader, name, namespace, xmlns) {
  if (!this.soapHeaders) {
    this.soapHeaders = [];
  }
  if (typeof soapHeader === 'object') {
    soapHeader = this.wsdl.objectToXML(soapHeader, name, namespace, xmlns);
  }
  this.soapHeaders.push(soapHeader);
};

Client.prototype.getSoapHeaders = function() {
  return this.soapHeaders;
};

Client.prototype.clearSoapHeaders = function() {
  this.soapHeaders = null;
};

Client.prototype.setEndpoint = function(endpoint) {
  this.endpoint = endpoint;
  this._initializeServices(endpoint);
};

Client.prototype.describe = function() {
  var types = this.wsdl.definitions.types;
  return this.wsdl.describeServices();
};

Client.prototype.setSecurity = function(security) {
  this.security = security;
};

Client.prototype.setSOAPAction = function(SOAPAction) {
  this.SOAPAction = SOAPAction;
};

Client.prototype._initializeServices = function(endpoint) {
  var definitions = this.wsdl.definitions,
    services = definitions.services;
  for (var name in services) {
    this[name] = this._defineService(services[name], endpoint);
  }
};

Client.prototype._defineService = function(service, endpoint) {
  var ports = service.ports,
    def = {};
  for (var name in ports) {
    def[name] = this._definePort(ports[name], endpoint ? endpoint : ports[name].location);
  }
  return def;
};

Client.prototype._definePort = function(port, endpoint) {
  var location = endpoint,
    binding = port.binding,
    methods = binding.methods,
    def = {};
  for (var name in methods) {
    def[name] = this._defineMethod(methods[name], location);
        if (!this[name]) this[name] = def[name];
  }
  return def;
};

Client.prototype._defineMethod = function(method, location) {
  var self = this;
  return function(args, callback, options) {
    if (typeof args === 'function') {
      callback = args;
      args = {};
    }
    self._invoke(method, args, location, function(error, result, raw) {
      callback(error, result, raw);
    }, options);
  };
};


//supportCookie
Client.prototype.setRobot=function(robot)
{
	this.Robot = robot;
}

Client.prototype.setCookie=function(val)
{
	this.supportCookie = val;
}

Client.prototype.setKeepAlive=function(val)
{
	this.keepAlive = val;
}

Client.prototype._invoke = function(method, args, location, callback, options) {
  var self = this,
    name = method.$name,
    input = method.input,
    output = method.output,
    style = method.style,
    defs = this.wsdl.definitions,
    ns = defs.$targetNamespace,
    encoding = '',
    message = '',
    xml = null,
    soapAction = this.SOAPAction ? this.SOAPAction(ns, name) : (method.soapAction || (((ns.lastIndexOf("/") !== ns.length - 1) ? ns + "/" : ns) + name)),
    headers = {
      SOAPAction: '"' + soapAction + '"',
      'Content-Type': "text/xml; charset=utf-8"
    },
    alias = findKey(defs.xmlns, ns);

    options = options || {};
		//supportCookie
		if(self.Robot)
		{
			options.Robot = self.Robot;
		}
   		if(self.supportCookie)
		{
			options.Cookie = self.supportCookie;
		}
   		options.agent = self.keepAlive;

  // Allow the security object to add headers
  if (self.security && self.security.addHeaders)
    self.security.addHeaders(headers);
  if (self.security && self.security.addOptions)
    self.security.addOptions(options);

  if (input.parts) {
    assert.ok(!style || style === 'rpc', 'invalid message definition for document style binding');
    message = self.wsdl.objectToRpcXML(name, args, alias, ns);
    (method.inputSoap === 'encoded') && (encoding = 'soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" ');
  } else if (typeof (args) === 'string') {
    message = args;
  } else {
    assert.ok(!style || style === 'document', 'invalid message definition for rpc style binding');
    message = self.wsdl.objectToDocumentXML(input.$name, args, input.targetNSAlias, input.targetNamespace, input.$type);
  }
  xml = "<soap:Envelope " +
    "xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" " +
    encoding +
    this.wsdl.xmlnsInEnvelope + '>' +
    "<soap:Header>" +
    (self.soapHeaders ? self.soapHeaders.join("\n") : "") +
    (self.security ? self.security.toXML() : "") +
    "</soap:Header>" +
    "<soap:Body>" +
    message +
    "</soap:Body>" +
    "</soap:Envelope>";

  self.lastRequest = xml;

  http.request(location, xml, function(err, response, body) {
    var result;
    var obj;
    self.lastResponse = body;
    self.lastResponseHeaders = response && response.headers;
    if (err || response.statusCode != 200) {
      callback(err,response,body);
    } else {
      try {
        obj = self.wsdl.xmlToObject(body);
      } catch (error) {
        error.response = response;
        error.body = body;
        return callback(error, response, body);
      }

      result = obj.Body[output.$name];
      // RPC/literal response body may contain elements with added suffixes I.E.
      // 'Response', or 'Output', or 'Out'
      // This doesn't necessarily equal the ouput message name. See WSDL 1.1 Section 2.4.5
      if(!result){
               result = obj.Body[name + 'Response'];
      }
	    if(!result) {
		var keys = Object.keys(obj.Body);
		if(keys.length != 0)
		    result = obj.Body[keys[0]];
		else
		    result = obj.Body;
            }
      callback(null, result, body);
    }
  }, headers, options);
};

exports.Client = Client;
