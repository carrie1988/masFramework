var http = require("http");
var https = require("https");
var url = require("url");
var crypto = require("crypto");
var fs = require("fs");
var qs = require("querystring");
var uuid = require("node-uuid");
var formidable = require('meap_form');
var servicename = "mobile_adapter_service";
var RBTContext = require("meap_rm_robot_context").RBTContext;
var zlib = require("zlib");
function buildServer(Context, config, index) {
    //LOG3("[MAS ] START SERVICE ", config, index);
    LOG3("[meap_rm_mobile_adapter_service][buildServer] START SERVICE ", config, index);
    function onRequest(request, response) {
        if (request.url == "/favicon.ico")
            return false;
        Context.Concurrent++;
        Context.incommingTrans++;
        var curDateTime = new Date();
        /*
         var sha = crypto.createHash("sha1");
         sha.update("" + curDateTime.getTime());
         sha.update("" + Context.hostname);
         sha.update("" + Context.Options.servicename);
         sha.update("" + Math.random());*/
        var serialNo = uuid.v1();
        var timeStamp = "[" + serialNo + "]";
        LOG5(timeStamp, "[MAS] ******************************A NEW REQUEST******************************************");

        if (!Context.CopyRight && !global.DEBUG) {
            _ERROR(timeStamp, "[meap_rm_mobile_adapter_service][buildServer] [ERROR]: Your MAS authorization has expired, please apply for a new license file AppCan");
            response.setHeader("Content-type", "application/json;charset=utf8");
            response.end(JSON.stringify({
                status: 18000,
                message: "Your MAS authorization has expired, please apply for a new license file AppCan"
            }));
            return false;
        }
        var nowTime = curDateTime.valueOf();
        var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
        var param = Context.handleReqURL(request.url, request);
        //获取设备操作系统版本
        var agent = request.headers['user-agent'];

        // for mobile App and web
        var softToken = JSON.parse(request.headers['deviceinfo'] || '{}').softToken || request.headers['softToken'] || "";
        if (!softToken) {
            //for web
            softToken = request.headers['user-agent'];
            var sha = crypto.createHash("sha1");
            sha.update("" + softToken);
            sha.update("" + ip);
            softToken = sha.digest("hex");
        }
        //极光推送ID
        var registrationID = request.headers['registrationid'] || "";
        //客户端发起时间戳
        var reqClientTime = request.headers['reqClienttime'] || "";
        //获取操作系统版本
        var mobOs = request.headers['mobileos'] || "";
        //获取应用号与版本信息
        var appid = request.headers['appid'] || "";
        var appver = request.headers['appver'] || "";
        var CountObject = {
            appid: appid,                           //应用号
            appVersion: appver,                     //应用版本
            method: request.method.toUpperCase(),   //客户端请求方式 GET or POSt
            host: Context.hostname,                 //服务器主机名
            cIP: ip,                                //客户端IP地址
            agent: agent,                           //客户端操作系统
            softToken: softToken,                   //客户端移动设备唯一标示，需要客户端生成
            t: param && param.type,                 //当前mas工程名
            cmd: param && param.cmd,                //当前客户端请求路径
            name: Context.Options.servicename,      //当前服务名
            size: 0,                                //mas返回报文大小 ,未gzip压缩情况下的大小
            err: 0,                                 //mas内部错误码
            reqClientTime: reqClientTime,           //客户端发起时间戳  13位时间戳
            requestdate: nowTime,                   //mas系统请求时间戳 13位时间戳
            responsetime: 0,                        //mas响应时间
            timeStamp: serialNo,                    //mas流水号
            pid: process.pid,                       //打印当前进程号
            reqTimes: Context.incommingTrans,       //当前进程请求累计次数
            sid: "",                                //sesssionID
            registrationID: registrationID,         //极光推送ID
            mobOs: mobOs                            //移动操作系统版本
        };
        if (param) {

            param.taskTimeStamp = timeStamp;
            //取头信息
            var authinfo = request.headers['x-mas-auth-info'] || request.headers['x-mas-app-info'];
            if (authinfo) {
                var path = authinfo.split("/");
                if (path.length == 1) {
                    param.sid = path[0];
                } else {
                    param.appid = path[0];
                    param.sid = path[1];
                }
            } else if (request.headers.cookie) {
                var cookies = qs.parse(request.headers.cookie.replace(/[ ]/g, ""), ";", "=");
                var authinfo = cookies['x-mas-auth-info'] || cookies['x-mas-app-info'];
                if (authinfo && authinfo != "null") {
                    var path = authinfo.split("/");
                    if (path.length == 1) {
                        if (param.sid != path[0]) {
                            param.sid = path[0] != "public" ? path[0] : param.sid;
                        }
                    } else {
                        param.appid = path[0];

                        if (param.sid == path[1]) {
                            param.sid = path[1];
                        } else {
                            param.sid = path[1] != "public" ? path[1] : param.sid;
                        }
                    }
                }
                cookies['x-mas-app-id'] ? param.appid = cookies['x-mas-app-id'] : '';
                cookies['x-mas-app-key'] ? param.appkey = cookies['x-mas-app-key'] : '';
            }
            request.headers['x-mas-app-id'] ? param.appid = request.headers['x-mas-app-id'] : '';
            request.headers['x-mas-app-key'] ? param.appkey = request.headers['x-mas-app-key'] : '';
            CountObject.sid = param && param.sid;
            CountObject.appid = param && param.appid;
        }

        //TODO add masUuid  print to console
        timeStamp = param.sid == "public" ? timeStamp : ("[" + param.sid + "]");
        param.taskTimeStamp = timeStamp;

        /**INITLIZE COUNTER OBJECT START**/
        try {
            CountObject.appAccess = Context.VerifyMan.appAccess[param.appid][Context.Options.servicename];
        } catch (e) {
            CountObject.appAccess = {
                "userAccessMinute": 0,
                "userAccessHour": 0,
                "userAccessDay": 0,
                "ipAccessMinute": 0,
                "ipAccessHour": 0,
                "ipAccessDay": 0,
                "appAccessMinute": 0,
                "appAccessHour": 0,
                "appAccessDay": 0
            }
        }
        if (Context.ServiceThreshold) {
            CountObject.serviceThreshold = Context.ServiceThreshold;
            CountObject.maxConcurrent = Context.MaxConcurrent;
            CountObject.maxWaiting = Context.maxWaiting;
        } else {
            CountObject.serviceThreshold = {
                "minute": 0,
                "hour": 0,
                "day": 0
            }
            CountObject.maxConcurrent = 0;
            CountObject.maxWaiting = 0;
        }
        /**INITLIZE COUNTER OBJECT END**/
        /**HOOK RESPONSE end function Start**/
        response.endFunction = response.end;
        response.cache = function (data, encoding, callback) {
            CountObject.size = Buffer.byteLength(data);
            CountObject.responsetime = (new Date().getTime() - nowTime) || 1;
            Context.CounterPublish(Context, CountObject);
            var i_f = param.i_f;
            if (i_f.gzip) {
                zlib.gzip(data, function (err, buffer) {
                    if (!err) {
                        response.setHeader('content-encoding', 'gzip');
                        response.setHeader("Content-length", buffer.length);
                        response.endFunction(buffer, encoding, callback);
                    } else {
                        response.endFunction(data, encoding, callback);
                        _ERROR(self.LogHeader, '[meap_rm_robot_context][RBTContext][gzip][ERROR]: zlib gzip is fail');
                    }
                });
            }
            else
                response.endFunction(data, encoding, callback);
        }
        response.end = function (data, encoding, callback) {
            if (typeof (data) == 'string') {
                CountObject.size = Buffer.byteLength(data);
                CountObject.responsetime = (new Date().getTime() - nowTime) || 1;
                Context.CounterPublish(Context, CountObject);
            } else {
                CountObject.size = 0;
                CountObject.responsetime = (new Date().getTime() - nowTime) || 1;
                Context.CounterPublish(Context, CountObject);
                response.endFunction(data, encoding, callback);
                return;
            }
            var i_f = param.i_f;
            if (i_f.cache && request.method.toLowerCase() == "get") {
                if (i_f["public"]) {
                    response.Robot.savePublicEXPCache(i_f.cacheKey, response, data, i_f.cacheTime);
                } else {
                    response.Robot.savePrivateEXPCache(i_f.cacheKey, response, data, i_f.cacheTime);
                }
            }

            if (i_f.gzip) {
                zlib.gzip(data, function (err, buffer) {
                    if (!err) {
                        response.setHeader('content-encoding', 'gzip');
                        response.setHeader("Content-length", buffer.length);
                        response.endFunction(buffer, encoding, callback);
                    } else {
                        response.endFunction(data, encoding, callback);
                        _ERROR(self.LogHeader, '[meap_rm_robot_context][RBTContext][gzip][ERROR]: zlib gzip is fail');
                    }
                });
            }
            else
                response.endFunction(data, encoding, callback);
            //TODO add callback

        };
        response.fail = function (Status, Message) {
            response.setHeader("Content-type", "application/json;charset=utf8");
            CountObject.size = 0;
            CountObject.err = Status
            CountObject.responsetime = (new Date().getTime() - nowTime) || 1;
            Context.CounterPublish(Context, CountObject);
            response.endFunction(JSON.stringify({
                status: Status,
                message: Message
            }));
        };
        /**HOOK RESPONSE end function END**/
        if (!param) {
            LOG2(curDateTime, "The Request URL format is wrong", request.url);
            response.fail(14400, "The Request URL format is wrong");
            return;
        }

        response.setHeader("access-control-allow-headers", "X-MAS-APP-Info,Content-Type,x-mas-app-id,Origin,MASSESSION,Access-Control-Request-Method,Access-Control-Request-Headers");
        response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS,PUT,DELETE");
        response.setHeader("Access-Control-Allow-Origin", "*");

        LOG2(timeStamp, "[meap_rm_mobile_adapter_service][buildServer] REQ PARAM ", param.appid, param.sid, param.type, param.cmd, param.params);

        if (config.secure && config.auth.type == "ssl") {
            if (!request.client.authorized) {
                //LOG4("[MAS ] HTTPS AUTH FAIL");
                LOG1(curDateTime, "[meap_rm_mobile_adapter_service][buildServer] HTTPS AUTH FAIL");
                response.fail(14200, "Your cert is fail");
                return;
            } else {
                var Cert = request.client.getPeerCertificate();
                //LOG5("[MAS ] CERT CN & APPID ",Cert.subject.CN, param.appid);
                LOG2(curDateTime, "[meap_rm_mobile_adapter_service][buildServer] CERT CN & APPID ", Cert.subject.CN, param.appid);
                if (!Context.VerifyMan.CheckCert(Cert.fingerprint, param.appid) && !global.noMAM) {
                    response.fail(14201, "Your application certificate has been out of service. Please check for a new version or contact the administrator!");
                    return;
                }
            }
        }

        if (Context.AppPolicyPower) {
            try {
                var verifystr = request.headers['appverify'];
                if (!verifystr) {
                    if (param.appkey && param.appkey != "") {
                        var currentTime = Date.now();
                        var md5 = crypto.createHash('md5');
                        md5.update(param.appid + ":" + param.appkey + ":" + currentTime);
                        var md5Data = md5.digest("hex");
                        verifystr = ("md5=" + md5Data + ";ts=" + currentTime);
                    }
                    else {
                        response.fail(14205, "Your application key verify code is null!");
                        return;
                    }
                }
                var verinfo = qs.parse(verifystr, ";", "=");
                if (!Context.VerifyMan.CheckApp(param.appid, verinfo.md5, verinfo.ts, Context.AppValidTime)) {
                    //appid and key verify fail
                    response.fail(14202, "Your application key is not reg on the server. Please check for a new version or contact the administrator!");
                    return;
                }
            } catch (e) {
                _ERROR(timeStamp, "[meap_rm_mobile_adapter_service][buildServer] [ERROR]: CHECK APP KEY Fail. ", e.message);
                response.fail(14202, "Your application key is not reg on the server. Please check for a new version or contact the administrator!");
                return;
            }
        }

        if (!Context.checkIP(servicename, ip, index)) {
            //LOG4("[MAS ] IP CHECK FAIL");
            LOG1(timeStamp, "[meap_rm_mobile_adapter_service][buildServer] IP CHECK FAIL");
            response.fail(14100, "Your Ip Address is permission denied!");
        } else if (!Context.checkBasic(servicename, request, index)) {
            //LOG4("[MAS ] BASIC AUTH FAIL");
            LOG1(timeStamp, "[meap_rm_mobile_adapter_service][buildServer] BASIC AUTH FAIL");
            response.fail(14300, "Your Basic Auth is permission denied!");
        } else {
            //LOG4("[MAS ] ROUTE TO INTERFACE");
            LOG1(timeStamp, "[meap_rm_mobile_adapter_service][buildServer] ROUTE TO INTERFACE", Context.MessageThreshold);
            param.nowTime = new Date().getTime();
            if (Context.MessageThreshold["service"][Context.Options.servicename] && Context.MessageThreshold["service"][Context.Options.servicename] > param.nowTime) {
                LOG2(timeStamp, 20000, "The Server is out of Access frequency. Please wait and retry!");
                response.fail(20000, "The Server is out of Access frequency. Please wait and retry!");
                return;
            }
            if (Context.MessageThreshold["app"]["APP" + CountObject.appid] && Context.MessageThreshold["app"]["APP" + CountObject.appid] > param.nowTime) {
                LOG2(timeStamp, 20000, "The Application is out of Access frequency. Please wait and retry!");
                response.fail(20000, "The Application is out of Access frequency. Please wait and retry!");
                return;
            }
            if (Context.MessageThreshold["appuser"]["APPUSER" + CountObject.sid] && Context.MessageThreshold["appuser"]["APPUSER" + CountObject.appid + CountObject.sid] > param.nowTime) {
                LOG2(timeStamp, 20000, "The Application USER is out of Access frequency. Please wait and retry!");
                response.fail(20000, "The Application USER is out of Access frequency. Please wait and retry!");
                return;
            }
            if (Context.MessageThreshold["appip"]["APPIP" + CountObject.cIP] && Context.MessageThreshold["appip"]["APPIP" + CountObject.appid + CountObject.cIP] > param.nowTime) {
                LOG2(timeStamp, 20000, "The Application IP is out of Access frequency. Please wait and retry!");
                response.fail(20000, "The Application IP is out of Access frequency. Please wait and retry!");
                return;
            }
            route(param, Context, request, response, index, CountObject);
        }
    }

    try {
        var server;
        if (config.protocal == "HTTPS") {
            var option = {
                key: fs.readFileSync(config.cert.key),
                cert: fs.readFileSync(config.cert.cert)
            }
            if (config.secure && config.auth.type == "ssl") {
                option.requestCert = true;
                option.rejectUnauthorized = false;
                option.ca = fs.readFileSync(config.auth.ca);
            }
            //LOG3("[MAS ] HTTPS OPTION ", option);
            LOG2("[meap_rm_mobile_adapter_service][buildServer] HTTPS OPTION ", option);
            server = https.createServer(option, onRequest).listen(config.port, config.host);
        } else
            server = http.createServer(onRequest).listen(config.port, config.host);
        //listener[config.port] = server;
        //LOG("[MAS ] Robot Manager Mobile Adapter Server has started. " + config.host + ":" + config.port);
        LOG2("[meap_rm_mobile_adapter_service][buildServer] Robot Manager Mobile Adapter Server has started. " + config.host + ":" + config.port);

    } catch (e) {
        _ERROR("[meap_rm_mobile_adapter_service][buildServer] [ERROR]: MAS Start Fail. ", e.message);
    }
}

function start(Context) {
    try {
        /*for (var i in Context.Services[servicename]) {
         var config = Context.Services[servicename][i];
         buildServer(Context, config, i);
         }*/
        for (var i = 0; i < Context.Services[servicename].length; i++) {
            var config = Context.Services[servicename][i];
            buildServer(Context, config, i);
        }
    } catch (e) {
        //LOG("[MAS ] ERROR: Start " + servicename + " Failed");
        _ERROR("[meap_rm_mobile_adapter_service][start] [ERROR]: Start " + servicename + " Failed" + "e: " + e.message);
    }
}

function filter(Param, Robot, Request, Response, i_f, Context) {

    var f = Context.Filter[i_f.type];
    if (f) {
        f(Param, Robot, Request, Response, i_f, function (result) {
            result === 0 ? i_f.handle.Runner(Param, Robot, Request, Response, i_f) : '';
        });
    } else {
        i_f.handle.Runner(Param, Robot, Request, Response, i_f);
    }
}

function runCommand(i_f, Request, Response, Param, Robot, Context) {

    LOG2(Param.taskTimeStamp, "[meap_rm_mobile_adapter_service][runCommand] ", "APPID : " + Param.appid, "TYPE : " + i_f.type);
    try {
        Robot.unGzip(Param, Request, function (result) {
            Param = result;
            Robot.cryptDecode(Param, Request);
            LOG1(Param.taskTimeStamp, "[MAS] *******************************RUN COMMAND******************************************");
            Robot.CurrentInterface = Param.cmd;
            Response.Robot = Robot;
            filter(Param, Robot, Request, Response, i_f, Context);
        });
    } catch (e) {
        _ERROR(Param.taskTimeStamp, "[meap_rm_mobile_adapter_service][runCommand][RunInterface] Run Custom interface failed. ", e.message);
        Response.fail(15000, "Run Custom interface failed. " + e.message);
    }
}

function route(param, Context, Request, Response, index, CountObject) {
    try {

        LOG1(param.taskTimeStamp, "[meap_rm_mobile_adapter_service][route] param cmd is ", param.cmd);
        var i_f = param.i_f;
        LOG1(param.taskTimeStamp, "[meap_rm_mobile_adapter_service][route] Route IF is ", i_f);

        if (Context.IfPolicyPower) {
            if (!Context.VerifyMan.CheckIfPolicy(param.appid, Context.Options.servicename, Context.Services[servicename][index].subservicename, i_f)) {
                //appid and if policy verify fail
                Response.fail(14203, 'Your application has no right to access this interface!');
                return;
            }
        }

        if (i_f && i_f.handle.Runner) {//&& i_f.sn == Context.Services[servicename][index].subservicename) {
            var method = (i_f.method ? i_f.method : "GET").toLowerCase();
            if (Request.method.toLowerCase() != method && method != "all") {
                LOG1(param.taskTimeStamp, "[meap_rm_mobile_adapter_service][route] IF METHOD IS NOT MATCH ");
                Response.fail(14508, 'Request Method is Wrong! This interface only support method ' + method);
                return;
            }

            if (Request.method.toLowerCase() == "get" || Request.method.toLowerCase() == "delete") {
                Context.BuildRobot(param.appid, param.sid, function (Robot) {
                    if (Robot) {
                        Response.Robot = Robot;
                        Robot.CurrentInterface = param.cmd;
                        //Robot.LogHeader = param.taskTimeStamp;
                        //TODO 获取masMask
                        CountObject.MasMark = Robot.Get("MASMark") || "";
                        Robot.LogHeader = "[" + param.appid + "]" + "[" + Context.hostname + "]" + param.taskTimeStamp + "[" + CountObject.softToken + "]" + "[" + Request.headers['user-agent'] + "]" + "[" + CountObject.cIP + "]" + "[" + Robot.Get("MASMark") + "]";

                        if (i_f.cache && Request.method.toLowerCase() == "get") {
                            if (!(i_f["public"] && i_f["cacheKey"]))//use key in interface.xml
                            {
                                i_f.cacheKey = (i_f["public"] ? "public" : param.sid) + param.cmd + JSON.stringify(param.params);
                            }
                            if (!i_f["public"]) {
                                Robot.checkPrivateCache(i_f.cacheKey, function (status, data) {
                                    if (status == 'CACHE') {
                                        LOG1(param.taskTimeStamp, "[meap_rm_mobile_adapter_service][route] PRIVATE CACHE TRUE ,METHOD IS", Request.method.toUpperCase());
                                        Response.cache(data);
                                        return;
                                        CounterPublish
                                    } else {
                                        runCommand(i_f, Request, Response, param, Robot, Context);
                                    }
                                });
                            } else {
                                Robot.checkPublicCache(i_f.cacheKey, function (status, data) {
                                    if (status == 'CACHE') {
                                        LOG1(param.taskTimeStamp, "[meap_rm_mobile_adapter_service][route] PUBLIC CACHE TRUE ,METHOD IS", Request.method.toUpperCase());
                                        Response.cache(data);
                                        return;
                                    } else {
                                        runCommand(i_f, Request, Response, param, Robot, Context);
                                    }
                                });
                            }
                        } else {
                            runCommand(i_f, Request, Response, param, Robot, Context);
                        }
                    } else {
                        Response.fail(14504, 'No such SID to be allowed.');
                    }
                }, (i_f["public"] && param.sid == "public"));
            } else {
                Request.pause();
                Context.BuildRobot(param.appid, param.sid, function (Robot) {
                    Request.resume();
                    if (!Robot) {
                        Response.fail(14504, 'No such SID to be allowed.');
                        return;
                    }
                    //TODO 获取masMask
                    CountObject.MasMark = Robot.Get("MASMark") || "";
                    Robot.LogHeader = "[" + param.appid + "]" + "[" + Context.hostname + "]" + param.taskTimeStamp + "[" + CountObject.softToken + "]" + "[" + Request.headers['user-agent'] + "]" + "[" + CountObject.cIP + "]" + "[" + Robot.Get("MASMark") + "]";
                    var form = new formidable.IncomingForm();
                    LOG1(param.taskTimeStamp, "[meap_rm_mobile_adapter_service][route] POST ANALYZE ");
                    form.parse(Request, function (err, fields, files, body) {
                        LOG2(param.taskTimeStamp, "[meap_rm_mobile_adapter_service][route] POST OVER ", err, fields, files, body);
                        if (err) {
                            Response.fail(14590, 'Upload File Failed.');
                            return;
                        }
                        param.fields = fields;
                        param.files = files;
                        param.body = body;
                        Response.Robot = Robot;
                        Robot.CurrentInterface = param.cmd;
                        //Robot.req();
                        runCommand(i_f, Request, Response, param, Robot, Context);
                    });
                }, (i_f["public"] && param.sid == "public"));
            }
        } else {
            _ERROR(param.taskTimeStamp, "[meap_rm_mobile_adapter_service][route][ERROR]: No request handler found for " + param.cmd);
            Response.fail(14500, 'No Such Command!');
            return;
        }
    } catch (e) {
        _ERROR(param.taskTimeStamp, "[meap_rm_mobile_adapter_service][route][ERROR]: Route Fail -  ", e.message);
        Response.fail(15000, 'Command dispatch fail!');
        return;
    }
}

/*
 var listener = {};
 process.on("message", function(port,socket) {
 process.nextTick(function(){
 var server = listener[port];
 LOG5("[MAS] message",port,server);
 if(server && socket) {
 socket.readable = socket.writable = true;
 socket.resume();
 server.connections++;
 socket.server = server;
 server.emit("connection", socket);
 socket.emit("connect");
 }
 });
 });
 */
exports.Runner = start;
