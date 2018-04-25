const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const cors = require('cors');
const _ = require('lodash');

const app = express();

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
