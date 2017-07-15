/**
 * @author qinghua.zhao
 */
var ldap = global.Require("ldapjs");
function errException(err, callback){
    callback(-1, {
        'status': '15300',
        'message': err
    });
}
function run(option, callback, robot){

	var client = ldap.createClient({url:option.uri});
	client.bind((option.name?option.name:option.binddn),option.password,function(err){
		if (!err) {
				callback(0,client);
			}
			else
			{
				client.unbind();
				errException(err, callback);
			}
	});
}	
exports.Runner = run;
