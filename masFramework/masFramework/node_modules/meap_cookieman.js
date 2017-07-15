var redisPool = require("meap_redispool").redisPool;
var URL = require("url");
var PATH = require("path");
function CookieAccessInfo(domain, path, secure, script) {

    if (this instanceof CookieAccessInfo) {
        this.domain = domain || undefined;
        this.path = PATH.normalize(path) || "/";
        this.secure = !!secure;
        this.script = !!script;
        return this;
    }
    else {
        return new CookieAccessInfo(domain, path, secure, script)
    }
}
function Cookie(cookiestr, domain) {
    {
        if (this instanceof Cookie) {
            if (typeof cookiestr == "object") {
                this.name = cookiestr.name;
                this.value = cookiestr.value;
                this.expiration_date = cookiestr.expiration_date;
                this.path = cookiestr.path;
                this.domain = cookiestr.domain;
                this.secure = cookiestr.secure; //how to define?
                this.noscript = cookiestr.noscript; //httponly
            }
            else if (cookiestr) {

                this.name = null;
                this.value = null;
                this.expiration_date = Infinity;
                this.path = "/";
                this.domain = domain ? domain : null;
                this.secure = false;				//how to define?
                this.noscript = false;				//httponly
                this.parse(cookiestr)
            }
            return this;
        }
        return new Cookie(cookiestr, domain)
    }
}
Cookie.prototype.toString = function toString() {
    var str = [this.name + "=" + this.value];
    if (this.expiration_date !== Infinity) {
        str.push("expires=" + (new Date(this.expiration_date)).toGMTString());
    }
    if (this.domain) {
        str.push("domain=" + this.domain);
    }
    if (this.path) {
        str.push("path=" + this.path);
    }
    if (this.secure) {
        str.push("secure");
    }
    if (this.noscript) {
        str.push("httponly");
    }
    return str.join("; ");
}
Cookie.prototype.toValueString = function toValueString() {
    return this.name + "=" + this.value;
}
var cookie_str_splitter = /[:](?=\s*[a-zA-Z0-9_\-]+\s*[=])/g
Cookie.prototype.parse = function parse(str) {
    if (this instanceof Cookie) {
        var parts = str.split(";")
            , pair = parts[0].match(/([^=]+)=((?:.|\n)*)/)
            , key = pair[1]
            , value = pair[2];
        this.name = key;
        this.value = value;
        for (var i = 1; i < parts.length; i++) {
            pair = parts[i].match(/([^=]+)(?:=((?:.|\n)*))?/)
                , key = pair[1].trim().toLowerCase()
                , value = pair[2];
            switch (key) {
                case "httponly":
                    this.noscript = true;
                    break;
                case "expires":
                    this.expiration_date = value
                        ? Number(Date.parse(value))
                        : Infinity;
                    break;
                case "path":
                    this.path = value
                        ? value.trim()
                        : "";
                    break;
                case "domain":
                    this.domain = value
                        ? value.trim()
                        : this.domain;
                    break;
                case "secure":
                    this.secure = true;
                    break
            }
        }
        return this;
    }
    return new Cookie().parse(str)
}
Cookie.prototype.matches = function matches(access_info) {
    if (this.noscript && access_info.script
        || this.secure && !access_info.secure
        || !this.collidesWith(access_info)) {
        return false
    }
    return true;
}
Cookie.prototype.collidesWith = function collidesWith(access_info) {
    if ((this.path && !access_info.path) || (this.domain && !access_info.domain)) {
        return false
    }
    if (this.path && access_info.path.indexOf(this.path) !== 0) {
        return false;
    }
    if (this.domain === access_info.domain) {
        return true;
    }
    else if (this.domain && this.domain.charAt(0) === ".") {
        var wildcard = access_info.domain.indexOf(this.domain.slice(1))
        if (wildcard === -1 || wildcard !== access_info.domain.length - this.domain.length + 1) {
            return false;
        }
    }
    else if (this.domain && access_info.domain.indexOf(this.domain) !== 0) {
        return false
    }
    return true;
}
function CookieMan(Context) {
    var self = this;
    LOG3("[meap_cookieman][CookieMan]", Context.Cookie);
    var option = Context.Cookie;
    self.RP = redisPool(option.db, option.poolsize, option.host, option.port, option.authpass);
    option.slaveHost && option.slavePort && (self.RPS = redisPool(option.db, option.poolsize, option.slaveHost, option.slavePort, option.authpass));
}
CookieMan.prototype.saveCookie = function (res, sid) {
    var self = this;
    if (!sid) return;
    var rescookies = res.headers['set-cookie'];
    if (!rescookies) return;
    var cookies = Array.isArray(rescookies)
        ? rescookies
        : rescookies.split(cookie_str_splitter);
    var successful = {};
    for (var i = 0; i < cookies.length; i++) {
        var cookie = Cookie(cookies[i], res.res.client._httpMessage._headers.host);
        successful[cookie.domain + ":" + cookie.path + ":" + cookie.name] = JSON.stringify(cookie);
    }
    self.RP.Runner(function (Client) {
        LOG3("[meap_cookieman][CookieMan][saveCookie] ", sid, successful);
        Client.HMSET(sid, successful);
        Client.EXPIRE(sid, 86400, function (err, data) {
            Client.Release();
        });
    });
}

CookieMan.prototype.removeCookie = function (sid) {
    var self = this;
    if (!sid) return;
    self.RP.Runner(function (Client) {
        LOG3("[meap_cookieman][CookieMan][removeCookie] ", sid);
        Client.DEL(sid, function (err, data) {
            Client.Release();
        });
    });
}

CookieMan.prototype.saveCookieEx = function (cookies, url, sid) {
    var self = this;
    var url = URL.parse(url);
    var host = url.host;
    var successful = {};
    for (var i = 0; i < cookies.length; i++) {
        var cookie = Cookie(cookies[i], host);
        successful[cookie.domain + ":" + cookie.path + ":" + cookie.name] = JSON.stringify(cookie);
    }
    self.RP.Runner(function (Client) {
        LOG3("[meap_cookieman][CookieMan][saveCookieEx] ", sid, successful);
        Client.HMSET(sid, successful);
        Client.EXPIRE(sid, 86400, function (err, data) {
            Client.Release();
        });
    });
}

CookieMan.prototype.getCookie = function (url, sid, cb) {
    var self = this;

    function getCookie(cookie_name, cookiestr, access) {
        var cookie = Cookie(JSON.parse(cookiestr));
        if (cookie.matches(access))
            return cookie;
        return null;
    }

    var url = URL.parse(url);
    var access = CookieAccessInfo(url.host, url.pathname, 'https:' == url.protocol);
    LOG3("[meap_cookieman][CookieMan][getCookie] ", url, access);

    self.RPS ? self.RPS.Runner(function (Client) {
        !Client ? cb(null) : Client.HGETALL(sid, function (err, data) {
            if (!err) {
                var matches = [];
                for (var cookie_name in data) {
                    var cookie = getCookie(cookie_name, data[cookie_name], access);
                    if (cookie) {
                        matches.push(cookie);
                    }
                }
                cb(matches);

            } else {
                cb(null);
                _ERROR("[meap_cookieman][CookieMan][getCookie][Error]", sid);
            }
            Client.Release();
        });
    }) : self.RP.Runner(function (Client) {
        !Client ? cb(null) : Client.HGETALL(sid, function (err, data) {
            if (!err) {
                var matches = [];
                for (var cookie_name in data) {
                    var cookie = getCookie(cookie_name, data[cookie_name], access);
                    if (cookie) {
                        matches.push(cookie);
                    }
                }
                cb(matches);

            } else {
                cb(null);
                _ERROR("[meap_cookieman][CookieMan][getCookie][Error]", sid);
            }
            Client.Release();
        });
    });
}

CookieMan.prototype.attachCookie = function (req, sid, cb) {
    var self = this;

    function getCookie(cookie_name, cookiestr, access) {
        var cookie = Cookie(JSON.parse(cookiestr));
        if (cookie.matches(access))
            return cookie;
        return null;
    }

    var url = URL.parse(req.url);
    var access = CookieAccessInfo(url.host, url.pathname, 'https:' == url.protocol);
    LOG3("[meap_cookieman][CookieMan][attachCookie] ", url, access);

    self.RPS ? self.RPS.Runner(function (Client) {
        !Client ? cb(-1) : Client.HGETALL(sid, function (err, data) {
            if (!err) {
                var matches = [];
                for (var cookie_name in data) {
                    var cookie = getCookie(cookie_name, data[cookie_name], access);
                    if (cookie) {
                        matches.push(cookie);
                    }
                }
                matches.toString = function toString() {
                    return matches.join(":");
                }
                matches.toValueString = function () {
                    return matches.map(function (c) {
                        return c.toValueString();
                    }).join(';');
                }
                LOG3("[meap_cookieman][CookieMan][attachCookie] ", sid, matches.toValueString());
                req.set("Cookie", matches.toValueString());
                cb(0);
            } else {
                cb(-1);
                _ERROR("[meap_cookieman][CookieMan][attachCookie][Error]", sid);
            }
            Client.Release();
        });
    }) : self.RP.Runner(function (Client) {
        !Client ? cb(-1) : Client.HGETALL(sid, function (err, data) {
            if (!err) {
                var matches = [];
                for (var cookie_name in data) {
                    var cookie = getCookie(cookie_name, data[cookie_name], access);
                    if (cookie) {
                        matches.push(cookie);
                    }
                }
                matches.toString = function toString() {
                    return matches.join(":");
                }
                matches.toValueString = function () {
                    return matches.map(function (c) {
                        return c.toValueString();
                    }).join(';');
                }
                LOG3("[meap_cookieman][CookieMan][attachCookie] ", sid, matches.toValueString());
                req.set("Cookie", matches.toValueString());
                cb(0);
            } else {
                cb(-1);
                _ERROR("[meap_cookieman][CookieMan][attachCookie][Error]", sid);
            }
            Client.Release();
        });
    });
}
module.exports.CookieMan = CookieMan;
