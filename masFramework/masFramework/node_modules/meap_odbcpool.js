var GP = require('meap_pool');
var odbc = require('meap_odbc');
function odbcPool(option)
{		
	if (this instanceof odbcPool) {
		var self = this;
		self.option = option;
		LOG1("[meap_odbcpool][odbcPool] CREATE ODBC POOL");
		self.pool = GP.Pool({
			name : 'odbc',
			create : function(callback) {
				try {
					var Client = new odbc.Database();
					Client.open(option.CN,function(error){
                        if (error) {
                            return callback(-1, null);
                        }
						callback(0, Client);
					});
					Client.Release = function(){
						LOG1("[meap_odbcpool][odbcPool][create] CLIENT RELEASED");
                        self.pool.release(this);
                    };
				} catch(e) {
					callback(-1, null);
				}
			},
			destroy : function(client) {
				LOG1("[meap_odbcpool][odbcPool][destroy] CONNECT DISCONNECT ");
				client.close(function(){
					
				});
			},
			max : option.poolsize,
			// optional. if you set this, make sure to drain() (see step 3)
			min : Math.min(0, option.poolsize),
			// specifies how long a resource can stay idle in pool before being removed
			idleTimeoutMillis : 60,
			// if true, logs via console.log - can also be a function
			log : false
		});
		return self;
	}
	return new odbcPool(option);
}
odbcPool.prototype.Runner = function(option,callback,robot)
{
	var self =this;
	LOG3("[meap_odbcpool][odbcPool][Runner] RUN SQL ",option);
	this.pool.acquire(function(err,client){
		_ERROR("[meap_odbcpool][odbcPool][Runner][ERROR] CLIENT READY ",err);
		if(!err)
		{
			client.query(option.sql,function(error, rows, more) {
				if (error) {
					callback(-1, {
						'status' : '15101',
						'message' : error
					});
				} else {
					LOG3("[meap_odbcpool][odbcPool][Runner] RES DATA ",rows,more);
					callback(0, rows, more);
				}
				if(!more)
					self.pool.release(client);
			});
		}
		else
		{
			callback(-1, {
				'status' : '15100',
				'message' : "No Ava ODBC Con"
			});
		}
	});
}
exports.odbcPool = odbcPool;
