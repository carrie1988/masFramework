 var util = require('util');
var crypto = require('crypto');
var CM = require("meap_cacheman");
var CMC = require("meap_cacheman_custom");
var zlib = require("zlib");
var qs = require("querystring");

function RBTContext(auth, Context, data) {
    var self = this;
    self.Context = Context;
    self.Auth = auth;
    self.Data = data;
    self.LogHeader = '[MAS-' + new Date().getTime() + ']:';
    self.secretKey = auth ? self.createSecretKey(auth.sid) : self.createSecretKey(0);
    return this;
}

RBTContext.prototype.createSession = function (Response, autoActive, expire, soleString) {
    var m = crypto.createHash('md5');
    m.update(Math.uuid(32, 32));
    var session = m.digest('hex');

    var cookies = [];
    cookies.push("MASSESSION=" + session + "; path=/");
    Response.setHeader("Set-Cookie", cookies);
    if (!this.Auth) {
        var _uuidstr = '';
        if (soleString) {
            if (soleString.length > 20) {
                _uuidstr = soleString;
            }
        }
        if (_uuidstr == '') {
            var _hrtime = process.hrtime();
            _uuidstr = Math.uuid(32, 32) + new Date().getTime() + Math.random(1, 5);
            if (process.pid) {
                _uuidstr = process.pid + '.' + _uuidstr;
            }
            if (_hrtime) {
                _uuidstr = _uuidstr + '.' + _hrtime[1];
            }
        }
        this.Auth = {sid: _uuidstr, session: session};
        if (autoActive != false)
            this.Context.authPush(this.Auth, expire, null);
        return _uuidstr;
    }
    else {
        this.Auth.session = session;
        if (autoActive != false)
            this.Context.authPush(this.Auth, expire, null);
        return this.Auth.sid;
    }
}

RBTContext.prototype.activeSession = function (expire) {
    if (this.Auth)
        this.Context.authPush(this.Auth, expire, null);
}

RBTContext.prototype.destroySession = function (req, Response) {
    if (this.Auth) {
        this.Auth.session = null;
        Response.setHeader("Set-Cookie", []);
        this.Context.authPop(this.Auth, null);
        this.Context.CookieMan.removeCookie(this.Auth.sid);
    }

    return true;
}

RBTContext.prototype.verifySession = function (req) {
    try {
        if (!this.Auth.session) {
            return false;
        }
        //var cookies = qs.parse(req.headers.cookie,";","=");
        var cookies = qs.parse(req.headers.cookie.replace(/[ ]/g, ""), ";", "=");
        if (cookies["MASSESSION"] == this.Auth.session) {
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

RBTContext.prototype.Set = function (key, value) {
    if (!this.Auth) return;
    var self = this;
    self.Context.RobotSet(self.Auth.appid, self.Auth.sid, key, value);
}

RBTContext.prototype.Get = function (key) {
    if (!this.Data) return;
    return this.Data["STORE" + key];
}

RBTContext.prototype.createSecretKey = function (sidkey) {
    //sidkey = sidkey.replace(/-/g,'');
    var md5 = crypto.createHash('md5');
    var md5key = md5.update(sidkey + 'appcan');
    var md5Data = md5.digest('hex');
    var buffData = new Buffer(md5Data);
    return buffData.toString('hex');
}

RBTContext.prototype.rcEncode = function (key, text) {
    var s = new Array();
    for (var i = 0; i < 256; i++) {
        s[i] = i;
    }
    var j = 0, x;
    for (i = 0; i < 256; i++) {
        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
    }
    i = j = 0;
    var ct = [];
    for (var y = 0; y < text.length; y++) {
        i = (i + 1) % 256;
        j = (j + s[i]) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
        ct.push(text[y] ^ s[(s[i] + s[j]) % 256]);
    }
    return new Buffer(ct);
}

RBTContext.prototype.cryptEncode = function (Data, Request, Response) {
    var self = this;
    if (Request.headers['algorithm'] == "true") {
        Response.setHeader('algorithm', 'true');

        var createRc = self.rcEncode(self.secretKey, new Buffer(Data));
        Data = createRc.toString('hex');
    }
    return Data;
}

RBTContext.prototype.cryptDecode = function (Param, Request) {
    var self = this;
    if (Request.headers['algorithm'] == "true") {
        if (Param.body == null || Param.body == 'undefined') {
            for (var i in Param.fields) {
                var destHex = new Buffer(Param.fields[i], 'hex');
                var fin = self.rcEncode(self.secretKey, destHex);
                Param.fields[i] = fin.toString();
            }
        } else {
            var destData = Param.body.toString();
            var dest = new Buffer(destData, 'hex');
            var fin = self.rcEncode(self.secretKey, dest);
            Param.body = fin.toString();
        }
    }
}

RBTContext.prototype.gzip = function (Data, Request, Response, cb) {
    var self = this;
    if (Request.headers['accept-encoding-appcan'] == "gzip") {
        zlib.gzip(Data, function (err, buffer) {
            if (!err) {
                Response.setHeader('content-encoding', 'gzip');
                Response.setHeader('transfer-encoding', 'chunked');
                // var resStr = buffer.toString('hex');
                cb(buffer);
            } else {
                cb(Data);
                _ERROR(self.LogHeader, '[meap_rm_robot_context][RBTContext][gzip][ERROR]: zlib gzip is fail');
            }
        });
    }
    else {
        cb(Data);
    }
}

RBTContext.prototype.unGzip = function (Param, Request, cb) {
    var self = this;
    if (Request.headers['accept-encoding-appcan'] == "gzip") {
        if (Param.body == null || Param.body == 'undefined') {
            var gunzipData = new Buffer(Param.fields, 'hex');
            zlib.unzip(gunzipData, function (err, buffer) {
                if (!err) {
                    Param.fields = buffer.toString();
                    cb(Param);
                } else {
                    cb(Param);
                    _ERROR(self.LogHeader, '[meap_rm_robot_context][RBTContext][unGzip][ERROR]: Param fields zlib gunzip is fail');
                }
            });
        } else {
            var gunzipData = new Buffer(Param.body, 'hex');
            zlib.unzip(gunzipData, function (err, buffer) {
                if (!err) {
                    Param.body = buffer.toString();
                    cb(Param);
                } else {
                    cb(Param);
                    _ERROR(self.LogHeader, '[meap_rm_robot_context][RBTContext][unGzip][ERROR]: Param body zlib gunzip is fail');
                }
            });
        }
    } else {
        cb(Param);
    }
}

// RBTContext.prototype.resettime = function()
// {
// this.timeout = new Date((new Date()).valueOf()+7200000);
// return this;
// }
// 
// RBTContext.prototype.outoftime = function()
// {
// return this.timeout.valueOf() < new Date().valueOf();
// }

RBTContext.prototype.attachCookie = function (req, cb) {
    var self = this;
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][attachCookie]");
    if (!this.Auth) return cb();
    this.Context.CookieMan.attachCookie(req, this.Auth.sid, cb);
}

RBTContext.prototype.getCookie = function (url, cb) {
    var self = this;
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][getCookie]");
    if (!this.Auth) return cb(null);
    this.Context.CookieMan.getCookie(url, this.Auth.sid, cb);
}

RBTContext.prototype.saveCookie = function (res) {
    var self = this;
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][saveCookie]");
    if (!this.Auth) return;
    this.Context.CookieMan.saveCookie(res, this.Auth.sid);
}

RBTContext.prototype.saveCookieEx = function (cookies, url) {
    var self = this;
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][saveCookieEx]");
    if (!this.Auth) return;
    this.Context.CookieMan.saveCookieEx(cookies, url, this.Auth.sid);
}

RBTContext.prototype.getCacheCC = function (url, cb, st) {
    var self = this;
    self.Context.CacheMan.getCacheControl(url, st, function (err, obj) {
        LOG3(self.LogHeader, "[meap_rm_robot_context][RBTContext][getCacheCC]:res ", err, obj);
        if (!err) {
            if (obj) {
                var CC = JSON.parse(obj);
                if (CC.EXP) {
                    if ((new Date()) < (new Date(CC.EXP))) {
                        self.Context.CacheMan.getCache(url, st, function (err, obj) {
                            if (err) {
                                cb("CHECK", CC);
                            } else {
                                cb("CACHE", obj);
                            }
                        });
                    } else {
                        cb("CHECK", CC);
                    }
                } else {
                    cb("CHECK", CC);
                }
            } else {
                cb("CHECK", {});
            }
        }
    });
}

RBTContext.prototype.getCacheCCCustom = function (url, cb, st) {
    var self = this;
    self.Context.CacheManCustom.getCacheControl(url, st, function (err, obj) {
        LOG3(self.LogHeader, "[meap_rm_robot_context][RBTContext][getCacheCCCustom]:res ", err, obj);
        if (!err) {
            if (obj) {
                var CC = JSON.parse(obj);
                if (CC.EXP) {
                    if ((new Date()) < (new Date(CC.EXP))) {
                        self.Context.CacheMan.getCache(url, st, function (err, obj) {
                            if (err) {
                                cb("CHECK", CC);
                            } else {
                                cb("CACHE", obj);
                            }
                        });
                    } else {
                        cb("CHECK", CC);
                    }
                } else {
                    cb("CHECK", CC);
                }
            } else {
                cb("CHECK", {});
            }
        }
    });
}

RBTContext.prototype.getCache = function (url, st, cb) {
    var self = this;
    self.Context.CacheMan.getCache(url, st, function (err, obj) {
        LOG3(self.LogHeader, "[meap_rm_robot_context][RBTContext][getCache]:res ", err, obj);
        if (err)
            cb("CHECK", {});
        else
            cb("CACHE", obj);
    })
}
RBTContext.prototype.getCacheCustom = function (url, st, cb) {
    var self = this;
    self.Context.CacheManCustom.getCache(url, st, function (err, obj) {
        LOG3(self.LogHeader, "[meap_rm_robot_context][RBTContext][getCacheCustom]:res ", err, obj);
        if (err)
            cb("CHECK", {});
        else
            cb("CACHE", obj);
    })
}
//////////////////////////////////////////////////////////////////////////////////////////////////
//
//				Manage the Public cache
//
//////////////////////////////////////////////////////////////////////////////////////////////////
RBTContext.prototype.savePublicCache = function (url, res, cache) {
    var self = this;
    var CC = CM.CacheControl(res);
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][savePublicCache]:", url, CC);
    this.Context.CacheMan.saveCache(url, "public", CC, cache, null);
}
RBTContext.prototype.savePublicEXPCache = function (url, res, cache, expdate) {
    //var CC = {EXP:expdate.toGMTString()};
    var self = this;
    var CC = {EXP: new Date(Date.now() + expdate * 1000).toGMTString()};
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][savePublicEXPCache]:", url, CC);
    this.Context.CacheMan.saveCache(url, "public", CC, cache, expdate);
}
RBTContext.prototype.checkPublicCache = function (url, cb) {
    if (!cb)
        return;
    this.getCacheCC(url, cb, "public");
}
RBTContext.prototype.getPublicCache = function (url, cb) {
    if (!cb) return;
    var self = this;
    self.getCache(url, "public", cb);
}
//////////////////////////////////////////////////////////////////////////////////////////////////
//
//				Manage the Private cache by sid
//
//////////////////////////////////////////////////////////////////////////////////////////////////
RBTContext.prototype.savePrivateCache = function (url, res, cache) {
    if (!this.Auth) return;
    if (!this.Auth.sid) return;
    var self = this;
    var CC = CM.CacheControl(res);
    LOG3(self.LogHeader, "[meap_rm_robot_context][RBTContext][savePrivateCache]:CC is ", CC, "--", this.Auth.sid);
    this.Context.CacheMan.saveCache(url, this.Auth.sid, CC, cache, null);
}
RBTContext.prototype.savePrivateEXPCache = function (url, res, cache, expdate) {
    if (!this.Auth) return;
    if (!this.Auth.sid) return;
    var self = this;
    //var CC = {EXP:expdate.toGMTString()};
    var CC = {EXP: new Date(Date.now() + expdate * 1000).toGMTString()};
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][savePrivateEXPCache]:CC is ", CC, "--", this.Auth.sid);
    this.Context.CacheMan.saveCache(url, this.Auth.sid, CC, cache, expdate);
}
RBTContext.prototype.checkPrivateCache = function (url, cb) {
    if (!this.Auth) return;
    if (!cb || !this.Auth.sid)
        return;
    var self = this;
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][checkPrivateCache]:", this.Auth.sid);
    this.getCacheCC(url, cb, this.Auth.sid);
}
RBTContext.prototype.getPrivateCache = function (url, cb) {
    if (!this.Auth) return;
    if (!cb || !this.Auth.sid) return;
    var self = this;
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][getPrivateCache]:", this.Auth.sid);
    self.getCache(url, this.Auth.sid, cb);
}

//////////////////////////////////////////////////////////////////////////////////////////////////
//
//				Manage the Private cache by mark
//
//////////////////////////////////////////////////////////////////////////////////////////////////
RBTContext.prototype.savePrivateCacheByUser = function (url, res, cache) {
    if (!this.Auth) return;
    if (!this.Get("MASMark")) return;
    var self = this;
    var CC = CM.CacheControl(res);
    LOG3(self.LogHeader, "[meap_rm_robot_context][RBTContext][savePrivateCacheByUser]:CC is ", CC, "--", this.Get("MASMark"));
    this.Context.CacheMan.saveCache(url, this.Get("MASMark"), CC, cache, null);
}
RBTContext.prototype.savePrivateByUserEXPCache = function (url, res, cache, expdate) {
    if (!this.Auth) return;
    if (!this.Get("MASMark")) return;
    var self = this;
    var CC = {EXP: new Date(Date.now() + expdate * 1000).toGMTString()};
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][savePrivateByUserEXPCache]:CC is ", CC, "--", this.Get("MASMark"));
    this.Context.CacheMan.saveCache(url, this.Get("MASMark"), CC, cache, expdate);
}
RBTContext.prototype.checkPrivateByUserCache = function (url, cb) {
    if (!this.Auth) return;
    if (!cb || !this.Get("MASMark"))
        return;
    var self = this;
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][checkPrivateByUserCache]:", this.Get("MASMark"));
    this.getCacheCC(url, cb, this.Get("MASMark"));
}
RBTContext.prototype.getPrivateByUserCache = function (url, cb) {
    if (!this.Auth) return;
    if (!cb || !this.Get("MASMark")) return;
    var self = this;
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][getPrivateByUserCache]:", this.Get("MASMark"));
    self.getCache(url, this.Get("MASMark"), cb);
}

//////////////////////////////////////////////////////////////////////////////////////////////////
//
//				Manage the custom cache  add by zhangjinhui
//
//////////////////////////////////////////////////////////////////////////////////////////////////
RBTContext.prototype.saveCustomPublicCache = function (url, res, cache) {
    var self = this;
    var CC = CMC.CacheControl(res);
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][saveCustomPublicCache]:", url, CC);
    this.Context.CacheManCustom.saveCache(url, "public", CC, cache, null);
}
RBTContext.prototype.saveCustomPublicEXPCache = function (url, res, cache, expdate) {
    //var CC = {EXP:expdate.toGMTString()};
    var self = this;
    var CC = {EXP: new Date(Date.now() + expdate * 1000).toGMTString()};
    LOG2(self.LogHeader, "[meap_rm_robot_context][RBTContext][saveCustomPublicEXPCache]:", url, CC);
    this.Context.CacheManCustom.saveCache(url, "public", CC, cache, expdate);
}
RBTContext.prototype.checkCustomPublicCache = function (url, cb) {
    if (!cb)
        return;
    this.getCacheCCCustom(url, cb, "public");
}
RBTContext.prototype.getCustomPublicCache = function (url, cb) {
    if (!cb) return;
    var self = this;
    self.getCacheCustom(url, "public", cb);
}
//////////////////////////////////////////////////////////////////////////////////////////////////
//
//				Manage the Log
//
//////////////////////////////////////////////////////////////////////////////////////////////////
RBTContext.prototype.LOG = function () {
    //LOG('[LOG]' + this.LogHeader + '[' + new Date().toLocaleString() + '][' + this.CurrentInterface + ']', "[" + (this.Auth ? this.Auth.sid : "public") + "]", "[" + (util.format.apply(this, arguments)) + "]");
    LOG('[LOG]' + this.LogHeader + '[' + new Date().valueOf() + '][' + new Date().toLocaleString() + '][' + this.CurrentInterface.split("/")[1] + ']', "[" + (util.format.apply(this, arguments)) + "]");
}
RBTContext.prototype.log = RBTContext.prototype.Log = RBTContext.prototype.LOG;

RBTContext.prototype.INFO = function () {
    LOG('[INFO]' + this.LogHeader + '[' + new Date().valueOf() + '][' + new Date().toLocaleString() + '][' + this.CurrentInterface.split("/")[1] + ']', "[" + (util.format.apply(this, arguments)) + "]");
}
RBTContext.prototype.info = RBTContext.prototype.Info = RBTContext.prototype.INFO;

RBTContext.prototype.WARN = function () {
    //_ERROR(this.LogHeader + '<' + new Date().toLocaleString() + '><' + this.CurrentInterface + '><WARN>', this.Auth ? this.Auth.sid : "public", util.format.apply(this, arguments), ']>\n');
    _ERROR('[WARN]' + this.LogHeader + '[' + new Date().valueOf() + '][' + new Date().toLocaleString() + '][' + this.CurrentInterface.split("/")[1] + ']', "[" + (util.format.apply(this, arguments)) + "]");
}
RBTContext.prototype.warn = RBTContext.prototype.Warn = RBTContext.prototype.WARN;

RBTContext.prototype.ERROR = function () {
    //_ERROR(this.LogHeader + '<' + new Date().toLocaleString() + '><' + this.CurrentInterface + '><ERROR>', this.Auth ? this.Auth.sid : "public", util.format.apply(this, arguments), ']>\n');
    _ERROR('[ERROR]' + this.LogHeader + '[' + new Date().valueOf() + '][' + new Date().toLocaleString() + '][' + this.CurrentInterface.split("/")[1] + ']', "[" + (util.format.apply(this, arguments)) + "]");
}
RBTContext.prototype.error = RBTContext.prototype.Error = RBTContext.prototype.ERROR;

//TODO req log record
RBTContext.prototype.REQ = function () {
    //_ERROR(this.LogHeader + '<' + new Date().toLocaleString() + '><' + this.CurrentInterface + '><ERROR>', this.Auth ? this.Auth.sid : "public", util.format.apply(this, arguments), ']>\n');
    LOG('[REQ]' + this.LogHeader + '[' + new Date().valueOf() + '][' + new Date().toLocaleString() + '][' + this.CurrentInterface.split("/")[1] + ']', "[" + (util.format.apply(this, arguments)) + "]");
}
RBTContext.prototype.req = RBTContext.prototype.Req = RBTContext.prototype.REQ;

exports.RBTContext = RBTContext;
