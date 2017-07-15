var createClient = function(option, cb, robot){
	if (!robot) {
		cb({
			'status' : '15201',
			'message' : "The robot can not be null"
		});
		return;
	}

	var jdbcpool = robot.Context.JDBCPOOLMAN[option.name];

	if (!jdbcpool) {
		cb({
			'status' : '15202',
			'message' : "The jdbc pool does not exist"
		});
		return;
	}

	jdbcpool.Runner(cb);
}

function execQuery(option, callback, robot) {
	createClient(option, function(client){
		if(!client){
			_ERROR("[meap_im_req_jdbc][execQuery][ERROR] createClient FAIL");
			callback(-1, {
				'status' : '15203',
				'message' : 'create JDBC Client FAIL'
			});
			return;
		}
		client.createStatement(function(err, statement) {
			if (err) {
				client.Release();
				_ERROR("[meap_im_req_jdbc][execQuery][ERROR] createStatement FAIL,",err);
				callback(-1, err);
			} else {
				statement.executeQuery(option.sql,function(err, resultset) {
					if (err) {
						client.Release();
						_ERROR("[meap_im_req_jdbc][execQuery][ERROR] executeQuery FAIL,",err);
						callback(-1, {
							'status' : '15204',
							'message' : err
						});
						return;
					} else if (resultset) {
						resultset.getMetaData(function(err,rsmd) {
							if (err) {
								client.Release();
								_ERROR("[meap_im_req_jdbc][execQuery][ERROR] getMetaData FAIL,",err);
								callback(-1, {
									'status' : '15205',
									'message' : err
								});
								return;
							} else {
								var results = [];
								var cc = rsmd.getColumnCountSync();
								var columns = [ '' ];
								for ( var i = 1; i <= cc; i++) {
									var colname = rsmd.getColumnNameSync(i);
									columns.push(colname);
								}
								var next = resultset.nextSync();
								var processRow = function(next) {
									if (next) {
										setImmediate(function() {
											var row = {};
											for ( var a = 1; a <= cc; a++) {
												row[columns[a]] = trim1(resultset.getStringSync(a));
											}
											results.push(row);
											next = resultset.nextSync();
											processRow(next);
										});
									} else {
										client.Release();
										callback(0, results);
									}
								};
								processRow(next);
							}
						});
					} else {
						client.Release();
						return callback(0, null);
					}
				});
			}
		});
	}, robot);
}

function execUpdate(option, callback, robot) {
	createClient(option, function(client){
		if(!client){
			_ERROR("[meap_im_req_jdbc][execUpdate][ERROR] createClient FAIL");
			callback(-1, {
				'status' : '15203',
				'message' : 'create JDBC Client FAIL'
			});
			return;
		}
		
		client.createStatement(function(err, statement) {
		    if (err) {
		    	client.Release();
		    	_ERROR("[meap_im_req_jdbc][execUpdate][ERROR] createStatement FAIL,",err);
		    	callback(-1, err);
		    } else {
		    	statement.executeUpdate(option.sql, function(err, rowcount) {
		    		if (err) {
		    			client.Release();
		    			_ERROR("[meap_im_req_jdbc][execUpdate][ERROR] executeUpdate FAIL,",err);
						callback(-1, {
							'status' : '15203',
							'message' : err
						});
						return;
		    		} else {
		    			client.Release();
		    			return callback(0, rowcount);
		    		}
		    	});
		    }
		});
	}, robot);
}

function trim1 (str) {
	return (str || '').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

exports.ExecQuery = execQuery;
exports.ExecUpdate = execUpdate;

