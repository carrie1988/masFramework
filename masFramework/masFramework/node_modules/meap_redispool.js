var GP = require('meap_pool');
var REDIS = require('meap_redis');
function redisPool(db, poolsize, host, port, authpass){
    if (this instanceof redisPool) {
        var self = this;
        self.host = host ? host : "127.0.0.1";
        self.port = port ? port : 6379;
        self.db = db ? db : 0;
        self.authpass = authpass ? authpass : undefined;

        self.pool = GP.Pool({
            name: 'redis',
            create: function(callback){
                try {
                    var Client = REDIS.createClient(self.port, self.host,{retry_max_delay:5000, auth_pass:self.authpass});
					Client.poolStatus = 0;
                    Client.Release = function(){

                        self.pool.release(this);
                    };
                    Client.on("ready", function(){
                        Client.select(self.db, function(){
							Client.poolStatus = 1;

                            callback(0, Client);
                        });
                    });
                    Client.on("error", function(e){
						Client.poolStatus = -1;
						if(!Client.poolStatus)
						{
							Client.end();
							callback(-1, null);
						}
                    });
                    Client.on("end", function(){

                    });
                }
                catch (e) {
                    callback(-1, null);
                }
            },
            destroy: function(client){

                client.closing=true;
				client.end();
            },
            max: poolsize,
            // optional. if you set this, make sure to drain() (see step 3)
            min: 0,//Math.min(global.minRedisPoolSize?global.minRedisPoolSize:0, poolsize),
            // specifies how long a resource can stay idle in pool before being removed
            idleTimeoutMillis: 0,
            reapIntervalMillis: -1,
            // if true, logs via console.log - can also be a function
            log: false
        });
        return self;
    }
    return new redisPool(db, poolsize, host, port, authpass);
}
redisPool.prototype.Runner = function(callback){
    var self = this;

    this.pool.acquire(function(err, client){
        if (!err) {
            callback((client.poolStatus == 1)?client:null);
			if(client.poolStatus == -1)
				client.Release();
        }
        else {
            callback(null);
        }
    });
}
exports.redisPool = redisPool;
