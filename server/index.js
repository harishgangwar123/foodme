var express = require('express');
var fs = require('fs');
var open = require('open');

var RestaurantRecord = require('./model').Restaurant;
var MemoryStorage = require('./storage').Memory;

var API_URL = '/api/restaurant';
var API_URL_ID = API_URL + '/:id';


exports.start = function(PORT, STATIC_DIR, DATA_FILE) {
  var app = express();
  var storage = new MemoryStorage();

  // log requests
  app.use(express.logger('dev'));

  // serve static files for demo client
  app.use(express.static(STATIC_DIR));

  // parse body into req.body
  app.use(express.bodyParser());


  // API
  app.get(API_URL, function(req, res, next) {
    res.send(200, storage.getAll());
  });


  app.post(API_URL, function(req, res, next) {
    var restaurant = new RestaurantRecord(req.body);
    var errors = [];

    if (restaurant.validate(errors)) {
      storage.add(restaurant);
      return res.send(201, restaurant);
    }

    return res.send(400, {error: errors});
  });


  app.put(API_URL_ID, function(req, res, next) {
    var restaurant = storage.getById(req.params.id);
    var errors = [];

    if (restaurant) {
      restaurant.update(req.body);
      return res.send(200, restaurant);
    }

    restaurant = new RestaurantRecord(req.body);
    if (restaurant.validate(errors)) {
      storage.add(restaurant);
      return res.send(201, restaurant);
    }

    return res.send(400, {error: errors});
  });


  app.del(API_URL_ID, function(req, res, next) {
    if (storage.deleteById(req.params.id)) {
      return res.send(204, null);
    }

    return res.send(400, {error: 'No restaurant with id "' + req.params.id + '"!'});
  });


  // start the server
  // read the data from json and start the server
  fs.readFile(DATA_FILE, function(err, data) {
    JSON.parse(data).forEach(storage.add);

    app.listen(PORT, function() {
      open('http://localhost:' + PORT + '/');
      // console.log('Go to http://localhost:' + PORT + '/');
    });
  });


  process.on('SIGINT', function() {
    // save the storage back to the json file
    fs.writeFile(DATA_FILE, JSON.stringify(storage.getAll()), function() {
      process.exit(0);
    });
  });
};
