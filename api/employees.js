const express = require('express');
const employeeRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite',
);

employeeRouter.get('/', (req, res, next) => {
  db.all(
    'SELECT * FROM Employee WHERE is_current_employee = 1',
    (err, employees) => {
      res.status(200).send({ employees: employees });
    },
  );
});

employeeRouter.post('/', (req, res, next) => {
  const employee = req.body.employee;
  if (!employee.name || !employee.position || !employee.wage) {
    return res.sendStatus(400);
  }
  db.run(
    'INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)',
    {
      $name: employee.name,
      $position: employee.position,
      $wage: employee.wage,
    },
    function (err) {
      db.get(
        'SELECT * FROM Employee WHERE id = $lastID',
        { $lastID: this.lastID },
        (err, employee) => {
          res.status(201).json({ employee: employee });
        },
      );
    },
  );
});

employeeRouter.param('employeeID', (req, res, next, employeeID) => {
  db.get(
    'SELECT * FROM Employee WHERE id = $employeeID',
    { $employeeID: employeeID },
    (err, employee) => {
      if (err) {
        next(err);
      } else if (employee) {
        req.employee = employee;
        next();
      } else {
        res.sendStatus(404);
      }
    },
  );
});

employeeRouter.get('/:employeeID', (req, res, next) => {
  res.status(200).json({ employee: req.employee });
});

module.exports = employeeRouter;
