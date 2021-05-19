module.exports = (app) => {
    require('dotenv').config()
    const https = require("https");
    const qs = require("querystring");
    const express = require("express");
    const user = require('./model');
    const checksum_lib = require("./Paytm/checksum");

    const parseUrl = express.urlencoded({ extended: false });
    const parseJson = express.json({ extended: false });

    app.get("/", (req, res) => {
        res.sendFile(__dirname + "/index.html");
    });
  
    app.post("/paynow", [parseUrl, parseJson], (req, res) => {
        var paymentDetails = {
            amount: req.body.amount,
            customerId: req.body.name,
            customerEmail: req.body.email,
            customerPhone: req.body.phone
        }
        if (!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
            res.status(400).send('Payment failed')
        } else {
            var params = {};
            params['MID'] = process.env.mid;
            params['WEBSITE'] = process.env.website;
            params['CHANNEL_ID'] = 'WEB';
            params['INDUSTRY_TYPE_ID'] = 'Retail';
            params['ORDER_ID'] = 'TEST_' + new Date().getTime();
            params['CUST_ID'] = paymentDetails.customerId;
            params['TXN_AMOUNT'] = paymentDetails.amount;
            params['CALLBACK_URL'] = 'http://localhost:3000/callback';
            params['EMAIL'] = paymentDetails.customerEmail;
            params['MOBILE_NO'] = paymentDetails.customerPhone;
  
  
            checksum_lib.genchecksum(params, process.env.key, function (err, checksum) {
                var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction";
  
                var form_fields = "";
                for (var x in params) {
                    form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
                }
                form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
  
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
                res.end();
            });
        }
    });
    app.post("/callback", (req, res) => {
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            var html = "";
            var post_data = qs.parse(body);
  
            console.log('Callback Response: ', post_data, "\n");
            const users = new user({
                CURRENCY: post_data.CURRENCY,
                GATEWAYNAME: post_data.GATEWAYNAME,
                RESPMSG: post_data.RESPMSG,
                BANKNAME: post_data.BANKNAME,
                PAYMENTMODE: post_data.PAYMENTMODE,
                MID: post_data.MID,
                TXNID: post_data.TXNID,
                RESPCODE: post_data.RESPCODE,
                TXNAMOUNT: post_data.TXNAMOUNT,
                ORDERID: post_data.ORDERID,
                STATUS: post_data.STATUS,
                BANKTXNID: post_data.BANKTXNID,
                TXNDATE: post_data.TXNDATE,
                CHECKSUMHASH: post_data.CHECKSUMHASH
            
            });
            users.save();
            var checksumhash = post_data.CHECKSUMHASH;
           
            var result = checksum_lib.verifychecksum(post_data, process.env.key, checksumhash);
            console.log("Checksum Result => ", result, "\n");
  
            var params = { "MID": process.env.mid, "ORDERID": post_data.ORDERID };
  
            checksum_lib.genchecksum(params, process.env.key, function (err, checksum) {
  
                params.CHECKSUMHASH = checksum;
                post_data = 'JsonData=' + JSON.stringify(params);
  
                var options = {
                    hostname: 'securegw-stage.paytm.in', 
                    port: 443,
                    path: '/merchant-status/getTxnStatus',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': post_data.length
                    }
                };
  
                var response = "";
                var post_req = https.request(options, function (post_res) {
                    post_res.on('data', function (chunk) {
                        response += chunk;
                    });
  
                    post_res.on('end', function () {
                      
                        console.log('S2S Response: ', response, "\n");
  
                        var _result = JSON.parse(response);
                        if (_result.STATUS == 'TXN_SUCCESS') {
                            res.send('payment sucess')
                        } else {
                            res.send('payment failed')
                        }
                    });
                });
                post_req.write(post_data);
                post_req.end();
            });
        });
    });
}