//获取可用的url
function UrlPool() {
    this.urls = [];
    this.atomicInteger = 0;
    return this;
}

UrlPool.prototype.getNextHiUrl = function () {
    if (0 == this.urls.length) {
        return null;
    }
    var url;
    for (var i = 0; i < this.urls.length; i++) {
        this.atomicInteger++;
        url = this.urls[((this.atomicInteger) % (this.urls.length))];
        if (1 == url.status) {
            return url;
        }
    }
    return null;
}

UrlPool.prototype.getNextUrl = function () {
    var HiUrl = this.getNextHiUrl();
    if (HiUrl) {
        return HiUrl.url;
    }
    return null;
}
//设置url池
UrlPool.prototype.setUrlPool = function (urlsArr) {
    //清空数组
    this.urls = [];
    var tempUrl = "";
    for (var i = 0; i < urlsArr.length; i++) {
        tempUrl = urlsArr[i];
        this.urls.push({
            "status": "1",
            "url": tempUrl
        });
    }
    this.atomicInteger = 0;
}

UrlPool.prototype.addUrl = function (url, nodeName) {
    this.urls.push({
        "status": "1",
        "nodeName": nodeName,
        "url": url
    });
}

UrlPool.prototype.clearUrlPool = function () {
    //清空数组
    this.urls = [];
    this.atomicInteger = 0;
}
exports.UrlPool = UrlPool; 