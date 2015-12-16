var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Cautus Appointment' });
});

router.get('/testsite', function(req, res, next) {
  res.render('testsite', { title: 'Cautus Appointment Test' });
});

module.exports = router;
