var fs = require("fs");
var path = require("path");
var java = null;
try {
    java = Require("java");
    java.options.push('-Xrs');
} catch (e) {
    console.warn("[meap_im_java]load java warning", e);
}

function init(workpath) {
    var dependencies = [];
    if (java) {
        var JarPath = path.join(workpath, "Jars");
        var exists = fs.existsSync(JarPath);

        if (exists) {
            var dependencies = fs.readdirSync(JarPath);
            dependencies.forEach(function (dependency) {
                java.classpath.push(path.join(JarPath, dependency));
            });
        }

        loadAXIS();
        loadJDBCJars();
    }
    LOG1("[meap_im_java][init] load classpath ", java);
}

var loadAXIS = function () {
    var AxisJarPath = path.join(process.env.NODE_PATH, "AXIS", "deps");
    var exists = fs.existsSync(AxisJarPath);

    if (exists) {
        var dependencies = fs.readdirSync(AxisJarPath);
        dependencies.forEach(function (dependency) {
            java.classpath.push(path.join(AxisJarPath, dependency));
        });
    }
    java.classpath.push(path.join(process.env.NODE_PATH, "AXIS", "client.jar"));
}

var loadJDBCJars = function () {
    var JDBCJarPath = path.join(process.env.NODE_PATH, "JDBCJars");
    var exists = fs.existsSync(JDBCJarPath);

    if (exists) {
        var dependencies = fs.readdirSync(JDBCJarPath);
        dependencies.forEach(function (dependency) {
            java.classpath.push(path.join(JDBCJarPath, dependency));
        });
    }
}

var _ = Require('underscore');

function JDBCConn() {
    this._config = {};
    this._conn = null;
}

JDBCConn.prototype.initialize = function (config, callback) {
    var self = this;
    self._config = config;

    java.newInstance(self._config.drivername, function (err, driver) {
        if (err) {
            return callback(err, {});
        } else {
            java.callStaticMethod('java.sql.DriverManager', 'registerDriver', driver, function (err, result) {
                if (err) {
                    return callback(err, {});
                } else {
                    return callback(null, self._config.drivername);
                }
            });
        }
    });
};

JDBCConn.prototype.open = function (callback) {
    var self = this;
    if (self._config.user && self._config.password) {
        java.callStaticMethod('java.sql.DriverManager', 'getConnection', self._config.url, self._config.user, self._config.password, function (err, conn) {
            if (err) {
                return callback(err, {});
            } else {
                self._conn = conn;
                return callback(null, conn);
            }
        });
    } else {
        java.callStaticMethod('java.sql.DriverManager', 'getConnection', self._config.url, function (err, conn) {
            if (err) {
                return callback(err, {});
            } else {
                self._conn = conn;
                return callback(null, conn);
            }
        });
    }
};

JDBCConn.prototype.close = function (callback) {
    var self = this;

    if (self._conn) {
        self._conn.close(function (err) {
            if (err) {
                return callback(err);
            } else {
                self._conn = null;
                return callback(null);
            }
        });
    }
};

exports.Init = init;
exports.JAVA = java;
exports.JDBCConn = JDBCConn;