var url = require("url");
var fs = require("fs");
var path = require("path");
var mime = require("meap_im_fs_mime").types;
var config = require("meap_im_fs_config");
var zlib = require("zlib");
function run(request, response, pathname) {
	var realPath = path.normalize(pathname.replace(/\.\./g, ""));
	var pathHandle = function(realPath) {
		fs.stat(realPath, function(err, stats) {
			if (err) {
				response.writeHead(404, "Not Found", {
					'Content-Type' : 'text/plain'
				});
				response.write("This request URL " + pathname + " was not found on this server.");
				response.end();
			} else {
				if (stats.isDirectory()) {
					response.writeHead(404, "Not Found", {
						'Content-Type' : 'text/plain'
					});
					response.write("This request URL " + pathname + " was not found on this server.");
					response.end();
				} else {
					var ext = path.extname(realPath);
					ext = ext ? ext.slice(1) : 'unknown';
					var contentType = mime[ext] || "application/octet-stream";
					response.setHeader("Content-Type", contentType);
					if (request.method.toLowerCase() == 'head') {
						response.writeHead(200, "Ok");
						// LOG5("[SF] HEAD REQUEST OK");
						LOG1("[meap_im_fs][run] HEAD REQUEST OK");
						response.end();
						return;
					}

					var lastModified = stats.mtime.toUTCString();
					var ifModifiedSince = "If-Modified-Since".toLowerCase();
					response.setHeader("Last-Modified", lastModified);
					if (ext.match(config.Expires.fileMatch)) {
						var expires = new Date();
						expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
						response.setHeader("Expires", expires.toUTCString());
						response.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge);
					}
					if (request.headers[ifModifiedSince] && lastModified == request.headers[ifModifiedSince]) {
						response.writeHead(304, "Not Modified");
						response.end();
					} else {
						var raw = fs.createReadStream(realPath);
						var acceptEncoding = request.headers['accept-encoding'] || "";
						var matched = ext.match(config.Compress.match);
						if (matched && acceptEncoding.match(/\bgzip\b/)) {
							response.writeHead(200, "Ok", {
								'Content-Encoding' : 'gzip'
							});
							raw.pipe(zlib.createGzip()).pipe(response);
						} else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
							response.writeHead(200, "Ok", {
								'Content-Encoding' : 'deflate'
							});
							raw.pipe(zlib.createDeflate()).pipe(response);
						} else {
							response.writeHead(200, "Ok");
							raw.pipe(response);
						}
					}
				}
			}
		});
	};
	pathHandle(realPath);
}
exports.staticfs = run;
