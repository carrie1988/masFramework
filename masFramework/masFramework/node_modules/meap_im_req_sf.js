
var sfs = require("meap_im_fs");
function run(option, callback, robot) {
	sfs.staticfs(option.Request,option.Response,option.pathname);
}
exports.Runner = run;