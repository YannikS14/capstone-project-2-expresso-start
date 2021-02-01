const express = require('express');
const timesheetRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite',
);

timesheetRouter.get('/', (req, res, next) => {
  db.all(
    'SELECT * FROM Timesheet WHERE employee_id = $employeeID',
    { $employeeID: req.params.employeeID },
    (err, timesheets) => {
      res.status(200).json({ timesheets: timesheets });
    },
  );
});

timesheetRouter.post('/', (req, res, next) => {
  const timesheet = req.body.timesheet;
  if (!timesheet.hours || !timesheet.rate || !timesheet.date) {
    return res.sendStatus(400);
  }
  db.run(
    'INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeID)',
    {
      $hours: timesheet.hours,
      $rate: timesheet.rate,
      $date: timesheet.date,
      $employeeID: req.params.employeeID,
    },
    function (err) {
      if (err) {
        next(err);
      }
      db.get(
        'SELECT * FROM Timesheet WHERE id = $lastID',
        { $lastID: this.lastID },
        (err, timesheet) => {
          res.status(201).json({ timesheet: timesheet });
        },
      );
    },
  );
});

timesheetRouter.param(
  'timesheetID',
  (req, res, next, timesheetID) => {
    db.get(
      'SELECT * FROM Timesheet WHERE id = $timesheetID',
      { $timesheetID: timesheetID },
      (err, timesheet) => {
        if (err) {
          next(err);
        } else if (timesheet) {
          req.timesheet = timesheet;
          next();
        } else {
          res.sendStatus(404);
        }
      },
    );
  },
);

timesheetRouter.put('/:timesheetID', (req, res, next) => {
  const timesheet = req.body.timesheet;
  if (!timesheet.hours || !timesheet.rate || !timesheet.date) {
    return res.sendStatus(400);
  }
  db.run(
    'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeID WHERE id = $timesheetID',
    {
      $hours: timesheet.hours,
      $rate: timesheet.rate,
      $date: timesheet.date,
      $employeeID: req.params.employeeID,
      $timesheetID: req.params.timesheetID,
    },
    (err) => {
      if (err) {
        next(err);
      }
      db.get(
        'SELECT * FROM Timesheet WHERE id = $id',
        { $id: req.params.timesheetID },
        (err, updatedTimesheet) => {
          res.status(200).json({ timesheet: updatedTimesheet });
        },
      );
    },
  );
});

timesheetRouter.delete('/:timesheetID', (req, res, next) => {
  db.run(
    'DELETE FROM Timesheet WHERE id = $timesheetID',
    { $timesheetID: req.params.timesheetID },
    () => {
      res.sendStatus(204);
    },
  );
});

module.exports = timesheetRouter;
