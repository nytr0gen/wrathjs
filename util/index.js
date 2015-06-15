const DEBUG = process.env.DEBUG==='1';

exports.debug = function(str) {
	if (DEBUG) {
		// TODO: Use arguments and console.log.call(this, [].slice.call(arguments));
		console.log(str);
	}		
};