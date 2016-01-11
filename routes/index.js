var express = require('express');
var router = express.Router();


var secret = 'AIzaSyAYYyFWedE8wTE_D5_A1Pwb_3uFHDB8tmc';
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Cautus Appointment' });
});

router.get('/testsite', function(req, res, next) {
  res.render('testsite', { title: 'Cautus Appointment Test', gcalapk: secret });
});

module.exports = router;
