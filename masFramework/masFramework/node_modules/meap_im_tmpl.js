
var t_f = function(t, d, cb) {
	return t.replace(/\$\{([^\}]*)\}/g, function(m, c) {
		if (c.match(/cb:/) && cb) {
			return cb(d, c.match(/cb:(.*)/));
		}
		var ar = c.split('.');
		var res = d;
		for (var key in ar)
		res = res[ar[key]];
		return res || "";
	});
}
var meap_tmpl = function(t, dd, cb) {
	return t_f(t, dd, cb);
}
exports.Runner=meap_tmpl;