var GP = require('meap_pool');
var JDBCConn = require('meap_im_java').JDBCConn;

function jdbcPool(option)
{
	if (this instanceof jdbcPool){
		var self = this;
		LOG1("[meap_jdbcpool][jdbcPool] CREATE JDBC POOL");
		self.pool = GP.Pool({
			name : 'jdbc',
			create : function(callback) {
				try {
					var jdbc = new JDBCConn();

                    jdbc.initialize(option, function(err, res) {
                	    if (err){
                	    	_ERROR("[meap_jdbcpool][jdbcPool][initialize][ERROR] jdbc initialize FAIL,", err);
                	    	callback(-1, null);
                	        return;
                	    }
                	});

                    jdbc.open(function(err, Client) {
                		if(err){
                			_ERROR("[meap_jdbcpool][jdbcPool][open][ERROR] jdbc open error,", err);
                			Client.poolStatus = -1;
							callback(-1, null);
							return;
                		}
                		
                		Client.Release = function(){
                        	LOG1("[meap_jdbcpool][jdbcPool] CLIENT RELEASED");
                            self.pool.release(this);
                        };
                		
                		Client.poolStatus = 1;
						LOG1("[meap_jdbcpool][jdbcPool] CLIENT READY",Client.poolStatus);
                        callback(0, Client);
                	});
				} catch(e) {
					callback(-1, null);
				}
			},
			destroy : function(client) {
				LOG1("[meap_jdbcpool][jdbcPool][destroy] CONNECT DISCONNECT ");
				client.close(function(err){
					LOG1("[meap_jdbcpool][jdbcPool][destroy][close] err ", err);
				});
			},
			max : 30,
			// optional. if you set this, make sure to drain() (see step 3)
			min : 0,
			// specifies how long a resource can stay idle in pool before being removed
			idleTimeoutMillis : 60,
			// if true, logs via console.log - can also be a function
			log : false
		});
		return self;
	}
	return new jdbcPool(option);
}

jdbcPool.prototype.Runner = function(callback)
{
	var self = this;
	LOG3("[meap_jdbcpool][jdbcPool][Runner] Create client");
	this.pool.acquire(function(err, client){
        if (!err) {
        	callback((client.poolStatus == 1)?client:null);
			if(client.poolStatus == -1)
				client.Release();
        } else {
        	_ERROR("[meap_jdbcpool][jdbcPool][Runner][ERROR] CLIENT READY ",err);
        	callback(null);
        }
    });
}

exports.jdbcPool = jdbcPool;
