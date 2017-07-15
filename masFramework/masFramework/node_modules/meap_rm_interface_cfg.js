var parser = require("meap_xml");
var fs = require("fs");
var util = require("util");
var events = require("events");
var path = require("path");
function interfaceConfig(realpath, context, project) {
    if (this instanceof interfaceConfig) {
        var self = this;
        events.EventEmitter.call(self);
        function buildWatcher() {
            self.watcher = fs.watch(realpath, function (event, fn) {
                if (event == "change") {
                    self.watcher.close();
                    self.watcher = null;
                    self.emit("CHANGE", {});
                }
            });
        }

        function loadInterfaces() {
            var result = parser.toJson(fs.readFileSync(realpath), {
                object: true
            });

            var defaultVersion = result.meap.interfaces.defaultVersion ? result.meap.interfaces.defaultVersion : undefined;
            LOG1("[meap_rm_interface_cfg][loadInterfaces][defaultVersion] ", defaultVersion);
            //加载zip标志,默认返回报文不开启zip压缩
            var proGzipSwitch = result.meap.interfaces.gzip ? result.meap.interfaces.gzip : false;
            LOG1("[meap_rm_interface_cfg][loadInterfaces][gzip] ", proGzipSwitch);
            if (Array.isArray(result.meap.interfaces["interface"])) {
                /*for (var i in result.meap.interfaces["interface"]) {
                 result.meap.interfaces["interface"][i].type = project;
                 buildInterface(context, result.meap.interfaces["interface"][i], defaultVersion);
                 }*/
                for (var i = 0; i < result.meap.interfaces["interface"].length; i++) {
                    result.meap.interfaces["interface"][i].type = project;
                    //根据proGzipSwitch 修正gzip标志
                    result.meap.interfaces["interface"][i].gzip = result.meap.interfaces["interface"][i].gzip ? result.meap.interfaces["interface"][i].gzip : proGzipSwitch;
                    buildInterface(context, result.meap.interfaces["interface"][i], defaultVersion);
                }
            }
            else {
                result.meap.interfaces["interface"].type = project;
                buildInterface(context, result.meap.interfaces["interface"], defaultVersion);
            }
        }

        self.on("CHANGE", function () {
            buildWatcher();
            for (var i in context.interfaces[project]) {
                var i_f = context.interfaces[project][i];
                {
                    i_f.watcher.close();
                    delete context.interfaces[project][i];
                }
            }
            delete context.interfaces[project];
            loadInterfaces();
        });
        buildWatcher();
        loadInterfaces();
        return self;
    }
    return new interfaceConfig(realpath, context, project);
}
util.inherits(interfaceConfig, events.EventEmitter);

buildInterface = function (Context, interf, defaultVersion) {
    try {
        if (!interf)
            return;
        //TODO Default interface
        var realpath = fs.realpathSync(path.join(Context.workpath, "interface", interf.type, interf.name, "if.js"));
        interface(realpath, interf, Context);
        //TODO load default version
        if (defaultVersion) {
            var defaultVersionReqPath = interf.path + "/" + defaultVersion;
            interface(realpath, interf, Context, undefined, defaultVersionReqPath);
        }

        //TODO load multi version interface
        if (interf.versions && interf.versions.version && typeof (interf.versions.version) == "object") {
            for (var i = 0; i < interf.versions.version.length; i++) {
                var filePath = fs.realpathSync(path.join(Context.workpath, "interface", interf.type, interf.name, "" + interf.versions.version[i], "if.js"));
                var reqPath = interf.path + "/" + interf.versions.version[i];
                interface(realpath, interf, Context, filePath, reqPath);
            }
        }
    }
    catch (e) {
        _ERROR("[meap_rm_interface_cfg][buildInterface][ERROR]:Load Interface Fail -- ", e.message, interf.type, interf.name);
    }
}

function interface(realpath, interf, Context, customFilePath, customReqPath) {
    if (this instanceof interface) {
        var self = this;
        events.EventEmitter.call(self);
        function buildWatcher() {
            self.watcher = fs.watch((customFilePath ? customFilePath : realpath), function (event, fn) {
                if (event == "change") {
                    self.watcher.close();
                    self.watcher = null;
                    self.emit("CHANGE", {});
                }
            });
        }

        function loadInterface() {
            var config = {};
            var if_func = global.Require((customFilePath ? customFilePath : realpath));
            var i_f = {
                name: interf.name,
                path: (customReqPath ? customReqPath : interf.path),
                type: interf.type,
                cache: interf.cache ? interf.cache : false,
                cacheTime: interf.cacheTime ? parseInt(interf.cacheTime) : 3600,
                config: config,
                sn: "",//interf.subservicename,
                method: (interf.method ? interf.method : "GET").toLowerCase(),
                handle: if_func,
                public: interf.public ? interf.public : false,
                watcher: self.watcher,
                tree: (customReqPath ? customReqPath : interf.path).split("/"),
                cacheKey: interf.cacheKey,
                gzip: interf.gzip
            };
            return i_f;
        }

        self.on("CHANGE", function () {
            buildWatcher();
            if (global.Require.cache[(customFilePath ? customFilePath : realpath)])
                delete global.Require.cache[(customFilePath ? customFilePath : realpath)];
            Context.interfaces[interf.type] = (Context.interfaces[interf.type] || {});
            var i_f = loadInterface();
            Context.interfaces[interf.type][i_f.method + "~" + (customReqPath ? customReqPath : interf.path)] = i_f;
        });
        buildWatcher();
        Context.interfaces[interf.type] = (Context.interfaces[interf.type] || {});
        var i_f = loadInterface();
        //TODO 关键
        Context.interfaces[interf.type][i_f.method + "~" + (customReqPath ? customReqPath : interf.path)] = i_f;
        LOG1("[meap_rm_interface_cfg][interface]:cmd", interf.type + "/" + (customReqPath ? customReqPath : interf.path));
        return self;
    }
    return new interface(realpath, interf, Context, customFilePath, customReqPath);
}

util.inherits(interface, events.EventEmitter);
function parseCfg(Context) {
    var context = Context;
    LOG1("[meap_rm_interface_cfg][parseCfg]:PARSE IF CFG START");
    for (var i in context.Projects) {
        loadProject(context.Projects[i], Context);
    }
}

function filterConfig(initPath, context, project) {
    if (this instanceof filterConfig) {
        var self = this;
        events.EventEmitter.call(self);
        function buildWatcher() {
            self.watcher = fs.watch(initPath, function (event, fn) {
                if (event == "change") {
                    self.watcher.close();
                    self.watcher = null;
                    self.emit("CHANGE", {});
                }
            });
        }

        function loadInterfaces() {
            try {
                context.Filter[project] = global.Require(initPath).Runner;
            } catch (e) {
                _ERROR("[meap_rm_interface_cfg][filterConfig][loadInterfaces]:error. " + e.message);
            }
        }

        self.on("CHANGE", function () {
            buildWatcher();
            if (global.Require.cache[initPath])
                delete global.Require.cache[initPath];
            delete context.Filter[project];
            loadInterfaces();

        });
        buildWatcher();
        loadInterfaces();
        return self;
    }
    return new filterConfig(initPath, context, project);
}

util.inherits(filterConfig, events.EventEmitter);

function loadProject(project, Context) {
    var context = Context;
    var appconfigpath = fs.realpathSync(path.join(context.workpath, "interface", project, "interface.xml"));
    try {
        if (fs.existsSync(path.join(context.workpath, "interface", project, "Filter.js"))) {
            var filterConfigpath = fs.realpathSync(path.join(context.workpath, "interface", project, "Filter.js"));
            filterConfig(filterConfigpath, Context, project);
        }
        interfaceConfig(appconfigpath, Context, project);
    }
    catch (e) {
        _ERROR("[meap_rm_interface_cfg][parseCfg][ERROR]:xParse Interface config fail. " + e.message);
    }
}

function deleteProject(project, Context) {
    var context = Context;
    for (var i in context.interfaces[project]) {
        var i_f = context.interfaces[project][i];
        {
            i_f.watcher.close();
            delete context.interfaces[project][i];
        }
    }
    delete context.interfaces[project];
}

exports.loadProject = loadProject;
exports.deleteProject = deleteProject;
exports.Runner = parseCfg;
