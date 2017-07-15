var fs = require("fs");
var crypto = require('crypto');
var exec = require('child_process').exec;
var masConf = JSON.parse(fs.readFileSync('/etc/MAS.conf'));
var service = "MAS";
var privateKey = "q!w@e#r$(ty)";

checkCopyright = function(callback){
	return callback(1, {type:"release", time:Date.now()});
	fs.exists(masConf.STMLicense, function(res){
        if(res){
    		try{
    			var Ciphertext = fs.readFileSync(masConf.STMLicense);
        		Ciphertext = Ciphertext.toString().trim();

        		var betaEncryptKey = betaLicense();
        		var betaCipherdata = rc4codec(betaEncryptKey, new Buffer(Ciphertext,"hex")).toString();

    			betaCipherdata = JSON.parse(betaCipherdata);

    			if(betaCipherdata.DATE){
    				var startDate = new Date(betaCipherdata.BeginDate).getTime();
        			var endDate = new Date(betaCipherdata.DATE).getTime();
        			var now = new Date().getTime();
        			if(startDate < now && endDate > now){
        				callback(1, {type:"beta", time:betaCipherdata.DATE});
        			}else{
        				callback(0, {type:"beta", time:betaCipherdata.DATE});
        			}
        		}else{
        			console.log("[checkCopyright][ERROR]: The current version is not authorized, will lead the service does not run properly, please upload authorization documents as soon as possible.");
        			callback(-1,{});
        		}
    		} catch (e) {
    			releaseLicense(function(releaseEncryptKey){
    				if(releaseEncryptKey){
                		try{
                			var releaseCipherdata = rc4codec(releaseEncryptKey, new Buffer(Ciphertext,"hex")).toString();

                			releaseCipherdata = JSON.parse(releaseCipherdata);
                    		
                    		if(releaseCipherdata.DATE){
                    			var startDate = new Date(releaseCipherdata.BeginDate).getTime();
                    			var endDate = new Date(releaseCipherdata.DATE).getTime();
                    			var now = new Date().getTime();
                    			if(startDate < now && endDate > now){
                    				callback(1, {type:"release", time:releaseCipherdata.DATE});
                    			}else{
                    				callback(0, {type:"release", time:releaseCipherdata.DATE});
                    			}
                    		}else{
                    			callback(-1,{});
                    		}
                		}catch(e){
                			console.log("[checkCopyright][ERROR]: The current version is not authorized, will lead the service does not run properly, please upload authorization documents as soon as possible.");
                			callback(-1,{});
                		}
    				}else{
    					console.log("[checkCopyright][ERROR]: The current version is not authorized, will lead the service does not run properly, please upload authorization documents as soon as possible.");
    					callback(-1,{});
    				}
    			});
    		}
        }else{
        	console.log("[checkCopyright][WARNING]: STMLicense.dat file does not exist, will lead the service does not run properly, please upload authorization documents as soon as possible.");
        	callback(-1,{});
        }
	});
}

function releaseLicense(callback){
	exec("ifconfig "+masConf.cmd, function (error, stdout, stderr) {
		if(!stderr){
			var ip = mac = '';
			var data = stdout.match(/inet addr:(.*)  Bcast/);
			if(data)
				ip = data[1].trim();
			data= stdout.match(/HWaddr(.*) /);
			if(data)
				mac=data[1].trim();

			ip = ipConversion(ip);
			mac = mac.toUpperCase();

			var md5 = crypto.createHash('md5');
			md5.update(ip);
			md5.update(mac);
			md5.update(service);
			md5.update(privateKey);
			var encryptKey = md5.digest('hex').toUpperCase();
			callback(encryptKey);
		}else{
			callback(false);
		}
	});
}

function betaLicense(){
	var ip = "255.255.255.255";
	var mac ="FF:FF:FF:FF:FF:FF";
	
	ip = ipConversion(ip);
	mac = mac.toUpperCase();

	var md5 = crypto.createHash('md5');
	md5.update(ip);
	md5.update(mac);
	md5.update(service);
	md5.update(privateKey);
	var encryptKey = md5.digest('hex').toUpperCase();

	return encryptKey;
}

function rc4codec(key, text)
{
    var s = new Array();
    for (var i=0; i<256; i++)
    {
        s[i] = i;
    }
    var j = 0, x;
    for (i=0; i<256; i++)
    {
        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
    }
    i = j = 0;
    var ct = [];
    for (var y=0; y<text.length; y++)
    {
        i = (i + 1) % 256;
        j = (j + s[i]) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
        ct.push(text[y] ^ s[(s[i] + s[j]) % 256]);
    }
    return new Buffer(ct);
}

var ipConversion = function(ip){
	if(!ip){
		ip = "0.0.0.0";
	}
	var ips = ip.split('.');
	var temp = desIp = "";
	var i,length = ips.length;
	for(i=0; i<length; i++){
		temp = parseInt(ips[i]);
		temp = temp.toString(16);
		temp = temp.length == 1 ? "0"+temp : temp;
		if(i < length-1){
			desIp += temp + ':';
		}else{
			desIp += temp;
		}
	}
	return desIp.toUpperCase();
}

exports.checkCopyright = checkCopyright;
