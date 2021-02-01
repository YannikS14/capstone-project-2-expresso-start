const express = require('express');
const apiRouter = express.Router();
const employeeRouter = require('./employees');

apiRouter.use('/employees', employeeRouter);

module.exports = apiRouter;
