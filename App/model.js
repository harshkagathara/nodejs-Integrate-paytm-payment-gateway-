var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	CURRENCY: String,
	GATEWAYNAME: String,
    RESPMSG: String,
    BANKNAME: String,
    PAYMENTMODE : String,
    MID: String,
    TXNID: String,
	RESPCODE: String,
    TXNAMOUNT: String,
    ORDERID: String,
	STATUS: String,
    BANKTXNID: String,
    TXNDATE: String,
    CHECKSUMHASH:String
    }, {
	timestamps: true
});

module.exports = mongoose.model('user', UserSchema);