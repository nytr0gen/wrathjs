const DEBUG = process.env.DEBUG==='1';

exports.debug = function(str) {
	if (DEBUG) {
		console.log(str);
	}		
};