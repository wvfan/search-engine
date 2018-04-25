const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const cors = require('cors');
const _ = require('lodash');

const run = require('./cloud_build/cloud').default;
const mongo = require('./cloud_build/cloud/mongo').default;

const app = express();

mongo.connect.then((db) => {
  app.set('port', (process.env.PORT || 5000));
  app.listen(app.get('port'), () => {
    console.log('Node app is running on port', app.get('port'));
  });

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true,
  }));

  app.set('views', path.join(__dirname, 'public'));
  app.engine('html', ejs.renderFile);
  app.set('view engine', 'html');

  app.get('/', (req, res) => {
    res.render('index.html');
  });

  app.post('/run', (req, res) => {
    run(req.body, res);
  });
}).catch((err) => {
  console.err('Connect Mongodb Error: ', err);
});
