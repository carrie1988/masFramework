var events = require("events");
var util = require("util");
var fs = require("fs");
var path = require("path");
var mime = require("meap_im_fs_mime").types;
var config = require("meap_im_fs_config");
var zlib = require("zlib");
var async = Require("async");

var cache = function(option) {
    var self = this;
    self.option = option;
    self.hitpoints = 0;
    self.expires = (new Date()).valueOf() + (self.option.expires || 3600) * 1000;
    self.size = 0;

    events.EventEmitter.call(self);
    self.buildwatcher(self);
    self.on("CHANGE", function() {
        self.buildwatcher(self);
    })
}

util.inherits(cache, events.EventEmitter);

cache.prototype.get = function() {
    var self = this;
    self.hitpoints++;
    self.expires = (new Date()).valueOf() + (self.option.expires || 3600) * 1000;
    return self.buffer;
}

cache.prototype.destory = function() {
    var self = this;
    self.watcher.close();
    self.watcher = null;
    self.option.parent.size -= self.size;
}

cache.prototype.cachefile = function(self, p) {
    var ext = path.extname(p);
    ext = ext ? ext.slice(1) : 'unknown';
    var contentType = mime[ext] || "application/octet-stream";
    self.contentType = contentType;

    var buffer = null;
    var fsstat = null;
    var gzipped = false;
    async.series([
    function(callback) {
        fs.readFile(p, function(err, buf) {
            buffer = buf;
            callback(err);
        });
    },
    function(callback) {
        fs.stat(p, function(err, stat) {
            fsstat = stat;
            callback(err);
        });
    },
    function(callback) {
        if (self.option.gzip && ext.match(config.Compress.match)) {
            zlib.gzip(buffer, function(err, buf) {
                buffer = buf;
                gzipped = true;
                callback(err);
            })
        } else
            callback(0)
    }], function(err, data) {
        if (!err) {
            self.buffer = buffer;
            self.lastModified = fsstat.mtime.toUTCString();
            self.option.parent.size -= self.size;
            self.size = self.buffer.length;
            self.option.parent.size += self.size;
            self.gzipped = gzipped;
            self.cached = true;
            self.emit("READY");
        } else {
            self.cached = false;
            if (self.option.parent.caches[self.option.path]) {
                self.destory();
                delete self.caches[option.path];
            }
            self.emit("ERR");
        }
    })
}

cache.prototype.buildwatcher = function(self) {
    self.watcher = fs.watch(self.option.path, function(event, fn) {
        if (event == "change") {
            self.watcher.close();
            self.watcher = null;
            self.emit("CHANGE", {});
        }
    });
    self.cachefile(self, self.option.path);
}
var cachemanager = function(option) {
    var self = this;
    events.EventEmitter.call(self);
    self.option = option;
    self.option.maxsize = (self.option.maxsize || 134217728);
    self.size = 0;
    self.caches = {};
    setInterval(function() {
        var t = new Date();
        var items = [];
        //SORT ITEMS;
        for (var i in self.caches) {
            if (items.length == 0 || self.caches[i].expires <= items[0].exp)
                items.unshift({
                    path : i,
                    exp : self.caches[i].expires
                });
            else if (self.caches[i].expires > items[0].exp)
                items.push({
                    path : i,
                    exp : self.caches[i].expires
                });
        }
        for (var i in items) {
            var item = items[i];
            var cache = self.caches[item.path];
            if (cache && (cache.expires < t || self.size > self.option.maxsize)) {
                self.caches[item.path].destory();
                delete self.caches[item.path];
            }
        }
    }, self.option.recyletime || 2000);
}

util.inherits(cachemanager, events.EventEmitter);

cachemanager.prototype.cache = function(option, callback) {
    var self = this;
    option.parent = self;
    var c = self.caches[option.path];
    if (!c) {
        c = new cache(option);
        c.once("READY", function() {
            self.caches[option.path]=c;
            callback(0, c);
        })
        c.once("ERR", function() {
            callback(-1, c);
        })
    } else {
    	callback(0, c);
    }
    return c;
}

cachemanager.prototype.setMAXSize = function(maxsize) {
    var self = this;
    self.option.maxsize = maxsize || 134217728;
}
var obj = new cachemanager({
    maxsize : 134217728
});

exports.sfcache = obj;
