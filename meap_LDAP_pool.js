var GP = require('meap_pool');
var LDAP = require('meap_LDAP');
function ldapPool(uri, poolsize){
    if (this instanceof ldapPool) {
        var self = this;
        self.uri = uri ? uri : "ldap://127.0.0.1";
        self.poolsize = poolsize ? poolsize : 100;
		LOG2("[meap_LDAP_pool][ldapPool]", self.uri, self.poolsize);
        self.pool = GP.Pool({
            name: 'ldap',
            create: function(callback){
	            try {
	                    var Client = new LDAP({uri:self.uri});
	                    Client.Release = function(){
	                        Client.resetOpts({uri:self.uri});
	                        self.pool.release(this);
	                    };
	                    Client.on("connected", function(){
							LOG1("[meap_LDAP_pool][ldapPool] CLIENT CONNECTED");
	                        callback(0, Client);
	                    });
	                    Client.on("disconnect", function(){
							LOG1("[meap_LDAP_pool][ldapPool] CONNECTION DISCONNECTED");
	                        self.pool.destroy(Client);
	                    });
	                    Client.open(function(err){
							if(!err)
							{
							    callback(0,Client);
							}
						});
	            } catch (e) {
					_ERROR("[meap_LDAP_pool][ldapPool][ERROR]",e.message);
	                callback(-1, null);
	            }
            },
            destroy: function(client){
				LOG1("[meap_LDAP_pool][ldapPool] DESTORY CLIENT");
                client.close();
            },
            max: poolsize,
            // optional. if you set this, make sure to drain() (see step 3)
            min: Math.min(global.minLDAPPoolSize?global.minLDAPPoolSize:0, poolsize),
            // specifies how long a resource can stay idle in pool before being removed
            idleTimeoutMillis: 0,
            reapIntervalMillis : -1,
            // if true, logs via console.log - can also be a function
            log: false
        });
        return self;
    }
    return new ldapPool(uri, poolsize)
}
var poolList = {};
function run(option,callback)
{
	if(!poolList[option.uri])
	{
		poolList[option.uri] = ldapPool(option.uri , global.ldapPoolSize?global.ldapPoolSize:100);
	}
	LOG2("[meap_LDAP_pool][run] ",option.uri);
	poolList[option.uri].pool.acquire(function(err, ldap){
	    if(ldap)
	    {
	        ldap.setOpts(option);
	    }
            callback(err,ldap?ldap:null);
    });
}

exports.Runner = run;