const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');
const app = express();
const PORT = process.env.PORT || 4000;
const apiRouter = require('./api/api');

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(errorhandler());

app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log('Server is listening on port: ' + PORT);
});

module.exports = app;
