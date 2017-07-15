/*
 * Copyright (c) 2011 Vinay Pulim <vinay@milewise.com>
 * MIT Licensed
 */

"use strict";

var url = require('url'),
    req;

var VERSION = "0.4.2";

var AJAX = require("meap_im_req_ajax");
exports.request = function(rurl, data, callback, exheaders, exoptions) {
  var curl = url.parse(rurl);
  var secure = curl.protocol === 'https:';
  var host = curl.hostname;
  var port = parseInt(curl.port || (secure ? 443 : 80));
  var path = [curl.pathname || '/', curl.search || '', curl.hash || ''].join('');
  var method = data ? "POST" : "GET";
  var headers = {
    "User-Agent": "node-soap/" + VERSION,
    "Accept" : "text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "none",
    "Accept-Charset": "utf-8",
    "Connection": "close",
 //       "Host" : host
  };
  var attr;

  if (typeof data === 'string') {
    headers["Content-Length"] = Buffer.byteLength(data, 'utf8');
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  exheaders = exheaders || {};
  for (attr in exheaders) { headers[attr] = exheaders[attr]; }

	var option = {
		url : rurl,
		method : method,
		Headers : headers,
		Body : data
	}
	
	//LOG5("[SA] HTTP ",exoptions);
	exoptions = exoptions || {};
	
	if(exoptions.pfx && exoptions.passphrase)
	{
		option.CA = [exoptions.pfx, exoptions.passphrase];
	}
	
	//supportCookie
	if(exoptions.Cookie){
		option.Cookie = true;
	}
	option.agent = exoptions.agent;
	AJAX.Runner(option,function(err,res,data){
		if(!err)
			callback(null,res,data)
		else
			callback(err);
	},exoptions.Robot);	
};
