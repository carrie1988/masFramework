/**
 * @author qinghua.zhao
 */
var path = require("path");
var parser = require("meap_xml");
var meap_auth = require("meap_im_auth");
var meap_tmpl = require("meap_im_tmpl");
var fs = require('fs');
function Config() {
	
}
Config.prototype.buildOption=function(name,query,context){
	
}
Config.prototype.init=function(fname)
{
	try{
	this.path = path.dirname(fname);
	this.fname = path.basename(fname);
	}
	catch(e)
	{
		//LOG("Config init fail: "+e.message);
		_ERROR("[meap_im_cfg][Config][init] Config init fail: "+e.message);
	}
}
function adapterConfig(res) {
	this.config = res._if;
}
adapterConfig.prototype = new Config;
adapterConfig.prototype.constructor = adapterConfig;
adapterConfig.prototype.buildOption = function(name, query, context,cb) {
	var options = {};
	var sub = this.config.subif;
	var workpath = this.path;
	
	//LOG("build option ",JSON.stringify(query));
	LOG3("[meap_im_cfg][adapterConfig][buildOption] build option ",JSON.stringify(query));
	
	function buildpost(post) {
		//LOG("build post ");
		LOG1("[meap_im_cfg][adapterConfig][buildOption][buildpost] build post ");
		var out = {};
		if (!post)
			return out;
		if (post.mutipart) {
			out.type = 'mutipart';
			out.post = {};
			for (var i in post.mutipart.part) {
				var part = post.mutipart.part[i];
				out.post[part.key] = meap_tmpl.Runner(part.value, query.params,cb);
			}
		} else if (post["x-www"]) {
			out.type = 'x-www';
			out.post = meap_tmpl.Runner(post["x-www"], query.params,cb);
		} else if (post.text) {
			out.type = 'text';
			out.post = meap_tmpl.Runner(post.text, query.params,cb);
		}
		return out;
	}
	
	function buildsoapparams(params)
	{
		//LOG("buildsoapparams");
		LOG1("[meap_im_cfg][adapterConfig][buildOption][buildsoapparams] buildsoapparams");
		var out = {};
		
		for (var i in params) {
			var param = params[i];
			out[param.key] = meap_tmpl.Runner(param.value, query.params,cb);
		}
		
		return out;
	}
	
	function buildauth(auth)
	{
		//LOG("buildauth");
		LOG1("[meap_im_cfg][adapterConfig][buildOption][buildauth]buildauth");
		var sec = null;
		//LOG("build auth "+ JSON.stringify(auth));
		LOG3("[meap_im_cfg][adapterConfig][buildOption][buildauth] build auth "+ JSON.stringify(auth));
		try{
			switch(auth.type)
			{
				case "wstext":
				case "wsdigest":
					sec = new meap_auth.WSSecurity(auth.username,
									 	auth.password,
									 	(auth.type=="wstext")?"PasswordText":"PasswordDigest");
				
				break;
				case "basic":
					sec = new meap_auth.BasicAuthSecurity(auth.username,auth.password);
				break;
				case "ssl":
					sec = new meap_auth.ClientSSLSecurity(path.join(workpath,auth.key),
													 path.join(workpath,auth.cert));
				break;
				default:
				break;
			}
			return sec;
		}
		catch(e)
		{
			//LOG("build auth "+e.message);
			_ERROR("[meap_im_cfg][adapterConfig][buildOption][buildauth][ERROR] build auth "+e.message);
			return null;
		}
	}
	function build(subif) {
		//LOG(JSON.stringify(subif));
		LOG3("[meap_im_cfg][adapterConfig][buildOption][build]"+JSON.stringify(subif));
		switch(subif.setting.type) {
			case 'ajax':
				{
					//LOG("build");
					LOG1("[meap_im_cfg][adapterConfig][buildOption][build] build");
					var setting = subif.setting;
					options.host = setting.host;
					options.port = setting.port ? setting.port : ((setting.secure == "true") ? 443 : 80);
					options.method = setting.method ? setting.method : "GET";
					options.path = setting.path;
					options.path = meap_tmpl.Runner(options.path, query.params,cb);
					var headers = {};
					headers['Accept-Charset'] = setting.charset ? setting.charset : "utf-8";
					var sec = buildauth(setting.auth);
					
					if (sec && sec.addHeaders)
						sec.addHeaders(headers);
					if (sec && sec.addOptions)
						sec.addOptions(options);
					/*
					 var cookies = context.buildCookies();
					 */
					options.headers = headers;
					return {
						'options' : options,
						'timeout' : (setting.timeout ? setting.timeout : 30),
						'protocal' : setting.secure,
						'post' : buildpost(setting.post),
						'resultparser' : setting.resultparser
					};
				}
				break;
			case 'soap':
				{
					var setting = subif.setting;
					if(setting.wsdl.indexOf("://")>=0 || setting.wsdl[0]=='/')
						options.wsdl=setting.wsdl;
					else
						options.wsdl = path.join(workpath, setting.wsdl);
					options.func = setting["function"];
					options.params= buildsoapparams(setting.params);
					return {
						'options' : options,
						'timeout' : (setting.timeout ? setting.timeout : 30),
						'auth'	  : buildauth(setting.auth),
						'resultfunction'  : setting.resultfunction
					};
				}
				break;
			case 'mysql':
				{
					var setting = subif.setting;
					LOG("mysql :"+JSON.stringify(setting));
					options = {
						hostname : setting.host,
						port : parseInt(setting.port)?parseInt(setting.port):3306,
						user : setting.auth.username,
						password : setting.auth.password,
						database : setting.dbname,
						charset : setting.charset?setting.charset:"utf8",
						compress : setting.compress,
						readTimeout: (setting.timeout ? setting.timeout : 30),
						writeTimeout:(setting.timeout ? setting.timeout : 10),
						timeout:(setting.timeout ? setting.timeout : 10)
					};
					return {
						'options' : options,
						'timeout' : (setting.timeout ? setting.timeout : 30),
					};
		
				}
				break;
		}
		return null;
	}
	if (Object.prototype.toString.apply(sub) === "[object Array]") {
		for (var n in sub) {
			if (sub[n].name == name)
				return build(sub[n]);
		}
	} else if (sub.name == name)
		return build(sub);
	else
		return null;
}
function parseCfg(path, cb) {
	var config = {};
	
	try {
		var result = parser.toJson(fs.readFileSync(path), {
			object : true
		});
		for (var n in result) {
			switch(n) {
				case "_if":
					config = new adapterConfig(result);
					config.init(path);
					return config;
				default:
					break;
			}
		}
	} catch(e) {
		//LOG("loadconfig fail: " + e.message);
		_ERROR("[meap_im_cfg][parseCfg] loadconfig fail: " + e.message);
		config = new Config();
		config.init(path);
	}
	return config;
}
exports.loadConfig = parseCfg; 