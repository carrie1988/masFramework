var redisPool = require("meap_redispool").redisPool;
var URL = require("url");
var Crypto = require("crypto");

function CacheControl(res) {
    var CC = {
        LM: res.headers["last-modified"], //If-Modified-Since
        ETAG: res.headers["etag"], //If-None-Match
        EXP: res.headers["expires"]
    }; //Expires
    return (CC.LM || CC.ETAG || CC.EXP) ? CC : null;
}

function CacheMan(Context) {
    LOG3("[meap_cacheman][CacheMan] CacheMan created ", Context.Cache);
    var self = this;
    var option = Context.Cache;
    self.RP = redisPool(option.db ? option.db : 1, option.poolsize, option.host, option.port, option.authpass);
    option.slaveHost && option.slavePort && (self.RPS = redisPool(option.db, option.poolsize, option.slaveHost, option.slavePort, option.authpass));
}

CacheMan.prototype.saveCache = function (url, st, cc, cache, cacheTime) {
    var m = Crypto.createHash('md5');
    m.update(url);
    m.update(st);
    var key = m.digest('hex');
    var item = {};
    item[st] = JSON.stringify(cc);
    item[st + "cache"] = cache;
    this.RP.Runner(function (Client) {
        if (cacheTime) {
            Client.MULTI().HMSET("cache~" + key, item, function (err, data) {
            }).EXPIRE("cache~" + key, cacheTime, function (err, data) {
            }).EXEC(function (err, replies) {
                Client.Release();
            });
        } else {
            Client.HMSET("cache~" + key, item, function (err, data) {
                Client.Release();
            });
        }
    });
}
CacheMan.prototype.getCacheControl = function (url, st, cb) {
    var self = this;
    var m = Crypto.createHash('md5');
    m.update(url);
    m.update(st);
    var key = m.digest('hex');
    self.RPS ? self.RPS.Runner(function (Client) {
            !Client ? cb(-1, null) : Client.HGET("cache~" + key, st, function (err, obj) {
                    //_ERROR("[meap_cacheman][CacheMan][getCacheControl][ERROR] ", err);
                    if (cb)
                        cb(err, obj);
                    Client.Release();
                });
        }) : self.RP.Runner(function (Client) {
            !Client ? cb(-1, null) : Client.HGET("cache~" + key, st, function (err, obj) {
                    //_ERROR("[meap_cacheman][CacheMan][getCacheControl][ERROR] ", err);
                    if (cb)
                        cb(err, obj);
                    Client.Release();
                });
        });
}

CacheMan.prototype.getCache = function (url, st, cb) {
    var self = this;
    var m = Crypto.createHash('md5');
    m.update(url);
    m.update(st);
    var key = m.digest('hex');
    self.RPS ? self.RPS.Runner(function (Client) {
            !Client ? cb(-1, null) : Client.HGET("cache~" + key, st + "cache", function (err, obj) {
                    //_ERROR("[meap_cacheman][CacheMan][getCache][ERROR] ", err);
                    if (cb)
                        cb(err, obj);
                    Client.Release();
                });
        }) : self.RP.Runner(function (Client) {
            !Client ? cb(-1, null) : Client.HGET("cache~" + key, st + "cache", function (err, obj) {
                    //_ERROR("[meap_cacheman][CacheMan][getCache][ERROR] ", err);
                    if (cb)
                        cb(err, obj);
                    Client.Release();
                });
        });
}

module.exports.CacheMan = CacheMan;
module.exports.CacheControl = CacheControl;