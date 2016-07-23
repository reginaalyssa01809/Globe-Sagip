var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
var orm = require('orm');

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/*
 * Database
 */
app.use(orm.express("postgresql://postgres:postgres@localhost/sagip", {
    define: function (db, models, next) {
        models.subscribers = db.define("subscribers", {
            access_token : String,
            subscriber_number : String,
            status : String,
            active : Boolean
        });

        models.location = db.define("location", {
            accuracy : String,
            altitude : String,
            latitude : String,
            longitude : String,
            map_url : String,
            timestamp : Date
        });

        models.organization = db.define("organization", {
            name : String
        });

        models.user = db.define("user", {
            user_name : String,
            password : String,
            access_token : String,
            subscriber_number : String,
            admin : Boolean
        });

        models.message = db.define("message", {
            content : String
        });

        models.subscribers.hasOne('currentLocation', models.location);
        models.subscribers.hasOne('baseLocation', models.location);

        models.user.hasOne("organization", models.organization);

        db.sync(function(err) {
            if(err) throw err;
        });
        next();
    }
}));


app.use(express.static(path.join(__dirname, 'public')));

/*
 * Routes
 */

app.get('/', function (req, res) {
    res.send('Hello World!');
});

/*
 * Globe API
 * */

var appShortCode = '21586966'; // full short code
var appId = 'djd9H6bA76CG5Tj7zriAXnCGzj4LH68z'; // application id
var appSecret = '874841e787fe889888dbd6d36cf1e99e41c2ffb833fea71f71171f0d45f7ed44'; // application secret
var callbackUrl = '/callback';
var notifyUrl = '/sms';

app.get(callbackUrl, function (req, res, next) {
    var accessToken = req.query['access_token'];
    var subscriberNumber = req.query['subscriber_number'];

    console.log(locate(accessToken, subscriberNumber, 1));
    console.log(accessToken);
    console.log(subscriberNumber);

    res.send({});
});

app.post(callbackUrl, function (request, response, next) {
    console.log(JSON.stringify(request.body, null, 4));
});

var locate = function (access_token, number, accuracy) {
    location = null;

    // e.g. https://devapi.globelabs.com.ph/location/v1/queries/location?access_token=V5fQ5QsFkv4rrJe8QcPp2yyUzaosmJ8GGzBDDbwIbRw&address=9754880843&requestedAccuracy=1
    url = 'https://devapi.globelabs.com.ph/location/v1/queries/location?access_token=' + access_token + '&address=' + number + '&requestedAccuracy=' + accuracy;

    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            location = body;
        }
    });

    return location;
};

/*
 * Listener
 */
http.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});