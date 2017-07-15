var fs = require("fs");
var path = require("path");
var JAVA = require("meap_im_java").JAVA;

function axis(option) {
	try{
		var soap = JAVA.newInstanceSync("mas.axis.DynamicInvoker", JSON.stringify(option));
		var location = soap.getLocationSync();
		return {
			soap:soap,
			location:location,
			Runner : function(option, callback) {
				try{
					var self = this.soap;
					self.invokeMethod(JSON.stringify(option.param),option.headers || "",JSON.stringify(option.sessions || {}), function(err,data) {
						callback(err, data);
					});
				}catch(e){
					_ERROR("[meap_im_axis][Runner] error", e);
					callback(-1, e.message);
				}
			}
		}
	}catch(e){
		_ERROR("[meap_im_axis][init] error", e);
		return null;
	}
}

exports.AXIS = axis;