
var GP = require('meap_pool');
var mysql = require('meap_mysql');
var url = require("url");
function mysqlPool(option)
{		
	if (this instanceof mysqlPool) {
		var con = url.parse(option.host);
		var self = this;
		self.option ={
			hostname: con.hostname?con.hostname:"127.0.0.1",
			port: con.port?parseInt(con.port):3306,
			user: option.username,
			password: option.password,
			database:	option.dbname,
			charset: option.charset?option.charset:"utf8"
		}
		LOG1("[meap_mysqlpool][mysqlPool] CREATE MYSQL POOL");
		self.pool = GP.Pool({
			name : 'mysql',
			create : function(callback) {
				try {
                    var Client = new mysql.Database(self.option).connect(function(error){
                        if (error)
                            callback(-1, null);
                        else
                            callback(0, Client);
                    });
				} catch(e) {
					callback(-1, null);
				}
			},
			destroy : function(client) {
				LOG1("[meap_mysqlpool][mysqlPool][destroy] CONNECT DISCONNECT ");
				client.disconnect();
			},
			max : option.poolsize,
			// optional. if you set this, make sure to drain() (see step 3)
			min : Math.min(10, option.poolsize),
			// specifies how long a resource can stay idle in pool before being removed
			idleTimeoutMillis : 0,
			// if true, logs via console.log - can also be a function
			log : false
		});
		return self;
	}
	return new mysqlPool(option);
}
mysqlPool.prototype.Runner = function(option,callback,robot)
{
	var self =this;
	LOG3("[meap_mysqlpool][mysqlPool][Runner] RUN SQL ",option);
	this.pool.acquire(function(err,client){
		_ERROR("[meap_mysqlpool][mysqlPool][Runner][ERROR] CLIENT READY ",err);
		if(!err)
		{
			client.query(option.sql).execute(function(error, rows, cols) {
				if (error) {
					callback(-1, {
						'status' : '15101',
						'message' : error
					});
				} else {
					LOG3("[meap_mysqlpool][mysqlPool][Runner] RES DATA ",rows,cols);
					callback(0, rows, cols);
				}
				self.pool.release(client);
			});
		}
		else
		{
			callback(-1, {
						'status' : '15100',
						'message' : "No Ava MYSQL Con"
					});
		}
	});
}
exports.mysqlPool = mysqlPool;
