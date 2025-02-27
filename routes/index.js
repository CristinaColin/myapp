var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Mi página de Express' });
});

router.get('/chart', function (req, res, next) {
  // res.render('index', { title: 'CHARTS' });
  // res.sendFile('C:\myapp\views\chart.html');
  res.sendFile(path.join(__dirname, '../views/chart.html'));
});

module.exports = router;
