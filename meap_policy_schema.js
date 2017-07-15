var mongoose = Require("mongoose");
var Schema =  mongoose.Schema;

/*create app model*/
var appSchema = new Schema({
	appid: String,
    appkey: String,
	appName: String,
	appDesc: String,
	status: {type: Number, default:1},
    createDate: Number,
    updateDate: Number
},{versionKey : false});

/*create cert model*/
var certSchema = new Schema({
	appid: String,
	CN: String,
    certName: String,
    certPass: String,
    certDesc: String,
    pem: String,
	status: {type: Number, default:1},
    createDate: Number,	
    expDate: Number
},{versionKey : false});

/*create interf model*/
var interfSchema = new Schema({
	appid: String,
	services: {type: Object}
},{versionKey : false});

/*create access model*/
var accessSchema = new Schema({
	appid: String,
	services: {type: Object}
},{versionKey : false});

/*create java model*/
var jdbcSchema = new Schema({
	service: {type: String, required:true},
	javaExtName: {type: String, required:true},
	javaExtEnName: {type: String, required:true},
	type: {type: String, required:true},
	javaExtDesc: {type: String},
	conf: {type: Object, required:true}
},{versionKey : false});

exports.appSchema = appSchema;
exports.certSchema = certSchema;
exports.interfSchema = interfSchema;
exports.accessSchema = accessSchema;
exports.jdbcSchema = jdbcSchema;

