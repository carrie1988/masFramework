/**
 * @author Zhangjinhui
 */
//var zookeeper = require('zkClient');
var zookeeper = require('node-zookeeper-client');
var fs = require("fs");
var path = require("path");
var MEAP = require("meap");
var UrlPool = require("meap_channelUrlPool").UrlPool;
var icsSvrZkPath = "/ics_nodes";
var icsCliZkPath = "/ics_clients";

function zookeeperClient(zkServer, clientId, confDir, tmOut, encoding) {
    this.zkServer = zkServer;
    this.clientId = clientId;
    this.confDir = path.join(confDir, "icshttpclient.properties");
    this.tmOut = tmOut;
    this.encoding = encoding;
    this.targetUrl = "";
    this.zkClient = null;
    this.UrlPool = new UrlPool();
    return this;
}

zookeeperClient.prototype.createClient = function () {
    return zookeeper.createClient(this.zkServer);
}

zookeeperClient.prototype.listChildren = function (client, path, cb) {

    var self = this;
    client.getChildren(path, function (event) {
        _INFO(path + "'s children changes,now reload children...");
        self.listChildren(client, path, cb);
    }, function (error, children, stat) {
        if (error) {
            console.log('Failed to list children of node: %s due to: %s.', path, error);
            cb(error, null);
            return;
        }
        //children : ["FULLGOLE_REGION_Z.FCUPADM","FULLGOLE_REGION.FCUPADM1"]
        console.log('Children of node: %s are: %j.', path, children);
        cb(null, children);
    });
}

zookeeperClient.prototype.getData = function (client, path, cb) {
    var self = this;
    client.getData(path, function (event) {
        _INFO(path + "  's data changes now reload this path data...");
        self.getData(client, path, cb);
    }, function (error, data, stat) {
        if (error) {
            console.log('Error occurred when getting data: %s.', error);
            cb(error, null);
            return;
        }
        console.log('Node: %s has data: %s, version: %d', path, data ? data.toString() : undefined, stat.version);
        cb(null, data ? data.toString() : undefined);
    });
}

zookeeperClient.prototype.createNode = function (client, path, data, createMode, cb) {
    client.create(path, data, createMode, function (error, path) {
        if (error) {
            console.log(error.stack);
            cb(error, null);
            return;
        }
        cb(null);
        console.log('Node: %s is created.', path);
    });
}
//处理子节点变化的函数
zookeeperClient.prototype.handleChildChange = function (client, path, children, confDir) {
    _INFO("children at " + path + " has changed! now reload children:" + children);
    if (typeof children == "string" && children.indexOf(",") >= 0) {
        children = children.split(",");
    }

    //TODO 删除渠道地址记录文件
    if (fs.existsSync(this.confDir)) {
        fs.unlinkSync(this.confDir);
    }
    //清空url池
    this.UrlPool.clearUrlPool();
    for (var i = 0; i < children.length; i++) {
        this.writeNodes(client, path, children[i], confDir);
    }
}
//记录变化的节点
zookeeperClient.prototype.writeNodes = function (client, path, children, confDir) {
    var self = this;
    self.getData(client, path + "/" + children, function (err, data) {
        if (!err && data) {
            _INFO(path + "/" + children + "  has : " + data);
            fs.appendFileSync(self.confDir, data);
            fs.appendFileSync(self.confDir, ";");
            //增加url
            self.addOrUpdateUrl(data, path + "/" + children);
            _INFO("updated mas UrlPool is " + JSON.stringify(self.UrlPool.urls));
        } else {
            console.log(" 读取节点  " + path + "/" + children + " 数据时出错,该节点可能已经被删除" + err);
        }
    });
}
//增加或者更新url池
zookeeperClient.prototype.addOrUpdateUrl = function (data, path) {
    var self = this;
    for (var i = 0; i < self.UrlPool.urls.length; i++) {
        if (self.UrlPool.urls[i]['nodeName'] == path) {
            self.UrlPool.urls[i]['url'] = data;
            return;
        }
    }
    self.UrlPool.addUrl(data, path);
}


//初始化zk
zookeeperClient.prototype.init = function () {
    var self = this;
    if (self.targetUrl) {
        self.UrlPool.setUrlPool(self.targetUrl.split(";"));
    } else {
        //TODO 加载配置文件
        if (fs.existsSync(self.confDir)) {
            self.targetUrl = fs.readFileSync(self.confDir);
        }

        self.zkClient = self.createClient();
        self.zkClient.once('connected', function () {
            console.log('Connected to ZooKeeper.');

            //列出节点
            self.listChildren(self.zkClient, icsSvrZkPath, function (err, childs) {
                if (!err) {
                    self.handleChildChange(self.zkClient, icsSvrZkPath, childs, self.confDir);
                }
            });

            //创建节点
            var path = icsCliZkPath + "/" + self.clientId;
            self.zkClient.exists(path, function (error, stat) {
                if (error) {
                    console.log(error.stack);
                    return;
                }
                if (stat) {
                    console.log('Node exists.');
                    //存在节点...
                } else {
                    //不存在
                    self.createNode(self.zkClient, path, "", zookeeper.CreateMode.EPHEMERAL, function (err, res) {
                        if (!err) {
                            console.log("node " + path + "创建成功...");
                        }
                    });
                }
            });

        });

        //建立连接
        self.zkClient.connect();
    }
}
//发送请求
zookeeperClient.prototype.sendReq = function (data, cb) {
    data = ( typeof data == 'object') ? JSON.stringify(data) : data;
    //GBk编码     charset=UTF-8
    var reqParam = {
        "data": MEAP.GBK.Encode(data)
    };
    var self = this;
    var url = this.UrlPool.getNextUrl();
    if (!url) {
        console.error(" error : not url avaliable! this UrlPool is " + JSON.stringify(this.UrlPool.urls));
        cb("error : not url avaliable!", null);
        return;
    }

    var option = {
        method: "POST",
        url: url,
        Headers: {
            "charset": "GBK"
        },
        Enctype: "application/x-www-form-urlencoded",
        Charset: "GBK",
        Body: reqParam
    };
    MEAP.AJAX.Runner(option, function (err, res, result) {
        if (!err) {
            cb(null, result);
        } else {
            cb(err, result);
        }
    }, undefined);
}

exports.zkClient = zookeeperClient;
