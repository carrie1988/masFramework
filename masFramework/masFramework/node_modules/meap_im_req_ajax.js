/**
 * @author qinghua.zhao
 */
var sa = require("meap_http");
var BUF = require("buffer");
var parser = require("meap_im_parser");
var Iconv = require("iconv").Iconv;
var mime = require("meap_im_fs_mime");
var methodPost = {
	'post':1,
	'search':1,
	'put':1,
	'delete':1,
	'link':1,
	'ulink':1
};
function bufparser(res, fn){
  res.data = [];
  res.on('data', function(chunk){ res.data.push(chunk)});
  res.on('end', function(){
  	res.text = BUF.Buffer.concat(res.data);
  	fn();
  });
};
function run(option, callback, robot,pretreatment) {
	if (!callback) return;
	
	var req = sa(option.method ? option.method : "GET", option.url);
	
	if(option.CA)
	{
	    //LOG4("[AJAX] CA ",option.CA);
		LOG2("[meap_im_req_ajax][run] CA ",option.CA);
	    req.ca(option.CA[0],option.CA[1]);
	}
	if(option.ClientAuthentication)
	{
		req.ca(option.ClientAuthentication.pfx,option.ClientAuthentication.pass);
		//LOG4("[AJAX] SET CA " ,option.ClientAuthentication.pfx,option.ClientAuthentication.pass);
		LOG2("[meap_im_req_ajax][run] SET CA " ,option.ClientAuthentication.pfx,option.ClientAuthentication.pass);
	}
	
	if(option.Params)
	{
		//LOG4("[AJAX] SET PARAMS");
		LOG1("[meap_im_req_ajax][run] SET PARAMS");
		req.query(buildData(option.Params));
	}
	if(option.agent == false)
	{
		req.agent(option.agent);
	}
	if(option.method && methodPost[option.method.toLowerCase()])
	{
		//LOG4("[AJAX] POST ENCTYPE " ,option.Enctype);
		LOG2("[meap_im_req_ajax][run] POST ENCTYPE " ,option.Enctype);
		if(option.Enctype){
			//LOG5("[AJAX] ",option.Enctype);
			LOG2("[meap_im_req_ajax][run] ",option.Enctype);
			req.set("Content-Type",option.Enctype);
   		}
		switch(option.Enctype)
		{
			case "application/x-www-form-urlencoded":
				if(option.Body)
				{
					var sdata = buildData(option.Body);
					req.send(sdata);
					//LOG4("[AJAX] BODY ", sdata);
					LOG3("[meap_im_req_ajax][run] BODY ", sdata);
				}	
				
			break;
			case "multipart/form-data":
				for(var part in option.Body)
				{
					req.field(part,option.Body[part]);
				}
				for(var file in option.Files)
				{
					if(!option.Files[file].contentType)
					{
						var ext = require("path").extname(option.Files[file].name?option.Files[file].name:option.Files[file].path);
						ext = ext.substr(1);
						option.Files[file].contentType=mime.types[ext];
					}
					req.attach(file, option.Files[file].path,option.Files[file].name?option.Files[file].name:null,option.Files[file].contentType);
				}
			break;
			case "text/plain":
			case "application/json":
			default:
		            
			    req.send(option.Body);
			break;
		}
	}	
	if(option.Headers){
		req._Headers = option.Headers;
		for(var hindex in option.Headers)
		{
			req.set(hindex,option.Headers[hindex]);
		}
		//LOG4("[AJAX] SET HEADER " ,option.Headers);
		LOG3("[meap_im_req_ajax][run] SET HEADER " ,option.Headers);
	}
	if(option.CacheControl)
	{
		for(var cindex in option.CacheControl)
		{
			switch(cindex)
			{
				case "LM":
					req.set("If-Modified-Since",option.CacheControl[cindex]);
					//LOG4("[AJAX] SET CC " ,option.CacheControl[cindex]);
					LOG3("[meap_im_req_ajax][run] SET CC " ,option.CacheControl[cindex]);
				break;
				case "ETAG":
					req.set("If-None-Match",option.CacheControl[cindex]);
					//LOG4("[AJAX] SET CC " ,option.CacheControl[cindex]);
					LOG3("[meap_im_req_ajax][run] SET CC " ,option.CacheControl[cindex]);
				break;
			}
		}
	}
	if(option.BasicAuth)
	{
		req.auth(option.BasicAuth.username,option.BasicAuth.password);
		//LOG4("[AJAX] SET BA " ,option.BasicAuth.username,option.BasicAuth.password);
		LOG2("[meap_im_req_ajax][run] SET BA " ,option.BasicAuth.username,option.BasicAuth.password);
	}
    if(option.Redir !== undefined)
	{
	    //LOG4("[AJAX] REDIR ",option.Redir);
		LOG2("[meap_im_req_ajax][run] REDIR ",option.Redir);
	    req.redirects(option.Redir);
	}
	{
		req.parse(bufparser);
	}
	
	
	req.buffer(true);
	try {
		
		if(option.Cookie && robot){
			robot.attachCookie(req, worker);
}
		else{
			worker(null);}
	} catch(e) {
			_ERROR("[meap_im_req_ajax][run][ERROR] AJAX ERROR: ",e.message);
			callback(-1, {});
	}
	
	
	function worker(err) {
		if (option.Stream) {
			//LOG4("[AJAX] STREAM DATA TO MOBILE");
			LOG1("[meap_im_req_ajax][run][worker] STREAM DATA TO MOBILE");
			req.pipe(option.Stream,{},function(err,res){
				//LOG4("[AJAX] STREAM DATA PIPE END");
				LOG1("[meap_im_req_ajax][run][worker] STREAM DATA PIPE END");
				callback(err,res);		
			});
			
		} else{
			req.end(function(err, res) {
				if (!err) {
				    //LOG5("[AJAX] RESPONSE BUFFER " ,res.text);
					LOG3("[meap_im_req_ajax][run][worker] RESPONSE BUFFER " ,res.text);
					if (option.Cookie && robot)
						robot.saveCookie(res);
					
					if (option.Charset) {
						//LOG4("[AJAX] CONVERT CODE FROM [",option.Charset,"] TO UTF-8");
						LOG2("[meap_im_req_ajax][run][worker] CONVERT CODE FROM [",option.Charset,"] TO UTF-8");
						var dest = conv(res.text,option.Charset,'UTF-8');
						if(dest)
							res.text = dest.toString();
						else
							res.text = res.text.toString();
					}	
					else
						res.text = res.text.toString();
					if (pretreatment)
						res.text = pretreatment(res.text);
					parser.Runner(option.Parser, res.text, function(code, data) {
						if (!code) {
							callback(err, res, data);
						} else {
							callback(err, res, null);
						}
					});
				} else{
					_ERROR("[meap_im_req_ajax][run][worker][ERROR] RESPONSE STATUS " ,err);
					callback(-1, err);
				}
			},option.Cookie?robot:null);
		}
	}
}
function conv(data,src,dest)
{
    try{
        var conv = new Iconv(src, dest);
        var result = conv.convert(data);
        delete conv;
        return result;
    }
    catch(e)
    {
		_ERROR("[meap_im_req_ajax][conv][ERROR] CONVERT FAIL ",e.message);
        return null;
    }
}
function encodeBuffer(buffer)
{
	var data="";
    for(var i=0;i<buffer.length;i++)
	{
		data+="%"+buffer[i].toString(16);
	}
	return data;
}
function buildData(obj)
{
	var sdata = "";
	for(var i in obj)
	{
		sdata+=(""+i+"="+obj[i]+"&");
	}
	if(sdata){
		sdata = sdata.substring(0,sdata.length-1);
	}
	return sdata;
}
exports.Runner = run;
exports.Convert = conv;
exports.EncodeBuffer = encodeBuffer;
