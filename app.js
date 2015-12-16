var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var nodemailer = require("nodemailer");
var routes = require('./routes/index');
var users = require('./routes/users');
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var moment = require('moment');
var _jade = require('jade');
var EmailTemplate = require('email-templates').EmailTemplate;



var app = express();
//GOOGLE API

var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
  process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'client_secret.json';

// Load client secrets from a local file.


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function (err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}




// SÄHKÖPOSTIN LÄHETYS!

//TRANSPORTTERI
var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: "oskari.putkonen@cautus.fi",
    pass: "Kai090915"
  }
});

//SAA TIEDOT
app.get('/send', function (req, res) {
    var varaaja = req.query.to;
    var firstname = req.query.firstname;
    var lastname = req.query.lastname;
    var phone = req.query.phone;
    var additional = req.query.text;
    var startdate = req.query.startdate;
    var enddate = req.query.enddate;
    var aloitusaika = moment(startdate).locale("fi").format('Do MMMM[ta] YYYY, [kello:] H:mm') ;
    var lopetussaika = moment(enddate).locale("fi").format('H:mm') ;
    var kokonimi = firstname+' '+lastname;
    var tiedot = phone+'</br>'+varaaja+'</br>'+additional;
    function saveEvents(auth) {
  
  var calendar = google.calendar('v3');
  var event = {
    'summary': kokonimi,
    'location': 'Nihtitorpankuja 5, Espoo, 02630',
    'description': tiedot,
    'start': {
         'dateTime': startdate,
         'timeZone': 'Europe/Helsinki'
    },
    'end': {
         'dateTime': enddate,
         'timeZone': 'Europe/Helsinki'
    },
    'attendees': [
      { 'email': 'oskari.putkonen@cautus.fi',
        'displayName': 'Oskari Putkonen' 
      },
      { 'email': varaaja,
        'displayName':lastname 
      }
    ],
    "reminders": {
  "useDefault": true
 }
  };

  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: event,
  }, function (err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
  });
}
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    authorize(JSON.parse(content), saveEvents);
  });
  
  var template = process.cwd() + '/views/template.jade';
  var template2 = process.cwd() + '/views/tiedoteTemplate.jade';

  // get template from file system
  fs.readFile(template, 'utf8', function(err, file){
    
  //compile jade template into function
      var compiledTmpl = _jade.compile(file, {filename: template});
      // set context to be used in template
      var context = {etunimi: firstname, sukunimi: lastname, email: varaaja, puh: phone, lis: additional, start: aloitusaika};
      // get html back as a string with the context applied;
      var html2 = compiledTmpl(context);
      
 
      
  var mailOptions = {
    to: varaaja,
    subject: 'Ajanvarauksenne',
    html: html2
    
  }
  
  console.log(mailOptions);
  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
      res.end("error");
    } else {
      console.log("Message sent: " + response.message);
      res.end("sent");
    }
    });
     
  });
  fs.readFile(template2, 'utf8', function(err, file){
     //compile jade template into function
      var compiledTmpl = _jade.compile(file, {filename: template2});
      // set context to be used in template
      var context = {etunimi: firstname, sukunimi: lastname, email: varaaja, puh: phone, lis: additional, start: aloitusaika, end: lopetussaika};
      // get html back as a string with the context applied;
      var html3 = compiledTmpl(context);
      
     var mailOptions2 = {
    to: 'oskari.putkonen@cautus.fi',
    subject: 'Uusi Ajanvaraus',
    html: html3
  }
      console.log(mailOptions2);
     smtpTransport.sendMail(mailOptions2, function (error, response) {
    if (error) {
      console.log(error);
      res.end("error");
    } else {
      console.log("Message sent: " + response.message);
      res.end("sent");
    }
  });
      
  });
});

/*--------------------Routing Over----------------------------*/
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')))
//app.use(express.static(path.join(__dirname, 'node_modules')))
//app.use('/scripts', express.static(path.join(__dirname, 'node_modules/fullcalendar/dist')));
app.use('/', routes);
app.use('/testsite', routes);
app.use('/users', users);


/*------------------Routing Started ------------------------*/




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



module.exports = app;

