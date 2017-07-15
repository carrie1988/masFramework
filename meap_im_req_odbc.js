var odbc = require('meap_odbc');
var url = require('url');
var meap_tmpl = require("meap_im_tmpl");
var pool = require("meap_odbcpool");
var async = Require("async");

function run(option, callback, robot){
	LOG3("[meap_im_req_odbc][run] ODBC option ", option);
    var db =new odbc.Database();
    db.open(option.CN, function(error){
        var self = db;
        if (error) {
			_ERROR("[meap_im_req_odbc][run][ERROR] CONNECT FAIL,", error);
            callback(-1, {
                'status': '15100',
                'message': error
            });
            return;
        }
        self.query(option.sql, function(error, rows, more){
            //LOG5("[ODBC] QUERY RESULT ", rows, more);
			LOG3("[meap_im_req_odbc][run] QUERY RESULT ", rows, more);
            if (error) {
                callback(-1, {
                    'status': '15101',
                    'message': error
                });
            }
            else {
                callback(0, rows, more);
            }
			db.close(function(){});
        });
    });
}

function transaction(option, precb, itemcb, rescb, robot){
	LOG3("[meap_im_req_odbc][transaction] ODBC option ", option);
    var db = new odbc.Database();
    db.open(option.CN, function(error){
        var self = db;
        if (error) {
            rescb(-1, {
                'status': '15100',
                'message': error
            });
            return;
        }
        var context = {};
        self.beginTransaction(function(err){
            if (err) {
                rescb(-1, {
                    'status': '15101',
                    'message': err
                });
                return db.close();
            }
            async.mapSeries(option.transaction, function(item, cb){
                var sql = precb ? precb(context, item) : item;
                self.query(sql, function(error, rows, more){
                    if(error){
                    	rescb(-1, {
                            'status': '15101',
                            'message': err
                        });
                        self.rollbackTransaction(function(err){
                            return db.close();
                        });
                    }else{
                    	var data = itemcb?itemcb(item, rows, context):{err:0,res:rows};
                        cb(data.err, data.res);
                    }
                });
            }, function(err, res){
                if (!err) {
                    self.commitTransaction(function(err){
						rescb(err, res);
						return db.close();
					});
                }else{
                    rescb(-1, {
                        'status': '15101',
                        'message': err
                    });
                    self.rollbackTransaction(function(err){
                        return db.close();
                    });
                }
            });
        });
    });
}
function buildstatement(sql, params, options, cb){
    options.sql = meap_tmpl.Runner(sql, params, cb);
}
function buildPool(option){
	return pool.odbcPool(option);
}
exports.BuildStatement = buildstatement;
exports.Runner = run;
exports.BuildPool = buildPool;
exports.Transaction = transaction;
