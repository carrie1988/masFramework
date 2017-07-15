
var mysql = process.binding('meap_mysql_bindings');
var url = require('url');
var meap_tmpl = require("meap_im_tmpl");
var mysqlpool = require("meap_mysqlpool");
function run(option, callback, robot){
    var con = url.parse(option.host);
    //LOG4("[MYSQL] MYSQL CONN ",con);
	LOG3("[meap_im_req_mysql][run] MYSQL CONN ",con);
    new mysql.Database({
        hostname: con.hostname?con.hostname:"127.0.0.1",
	port: con.port?parseInt(con.port):3306,
        user: option.username,
        password: option.password,
        database: option.dbname,
		charset: option.charset?option.charset:"utf8"
    }).connect(function(error){
        if (error) {
			_ERROR("[meap_im_req_mysql][run][ERROR] CONNECT FAIL,",error);
            callback(-1, {
                'status': '15100',
                'message': error
            });
            return;
        }
        this.query(option.sql).execute(function(error, rows, cols){
			_ERROR("[meap_im_req_mysql][run][ERROR] QUERY RESULT ",error);
			LOG3("[meap_im_req_mysql][run] QUERY RESULT ",rows,cols);
            if (error) {
                callback(-1, {
                    'status': '15101',
                    'message': error
                });
            }
            else {
                callback(0, rows, cols);
            }
        });
    });
}
function buildstatement(sql, params, options,cb)
{
	options.sql = meap_tmpl.Runner(sql,params,cb);
}
function buildPool(option)
{
	return mysqlpool.mysqlPool(option);
}
exports.BuildStatement=buildstatement;
exports.Runner = run;
exports.BuildPool = buildPool;

