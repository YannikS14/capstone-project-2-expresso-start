const express = require('express');
const employeeRouter = express.Router();
const sqlite3 = require('sqlite3');
const timesheetRouter = require('./timesheets');
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

employeeRouter.put('/:employeeID', (req, res, next) => {
  const employee = req.body.employee;
  if (!employee.name || !employee.position || !employee.wage) {
    return res.sendStatus(400);
  }
  db.run(
    'UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE id = $id',
    {
      $name: employee.name,
      $position: employee.position,
      $wage: employee.wage,
      $id: req.params.employeeID,
    },
    () => {
      db.get(
        'SELECT * FROM Employee WHERE id = $id',
        { $id: req.params.employeeID },
        (err, updatedEmployee) => {
          res.status(200).json({ employee: updatedEmployee });
        },
      );
    },
  );
});

employeeRouter.delete('/:employeeID', (req, res, next) => {
  db.run(
    'UPDATE Employee SET is_current_employee = 0 WHERE id = $id',
    { $id: req.params.employeeID },
    () => {
      db.get(
        'SELECT * FROM Employee WHERE id = $id',
        { $id: req.params.employeeID },
        (err, employee) => {
          res.status(200).json({ employee: employee });
        },
      );
    },
  );
});

employeeRouter.use('/:employeeID/timesheets', timesheetRouter);

module.exports = employeeRouter;
