const express = require('express');
const menuRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite',
);
const menuItemsRouter = require('./menuItems');

menuRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (err, menus) => {
    res.status(200).send({ menus: menus });
  });
});

menuRouter.post('/', (req, res, next) => {
  const menu = req.body.menu;
  if (!menu.title) {
    return res.sendStatus(400);
  }
  db.run(
    'INSERT INTO Menu (title) VALUES ($title)',
    {
      $title: menu.title,
    },
    function (err) {
      db.get(
        'SELECT * FROM Menu WHERE id = $lastID',
        { $lastID: this.lastID },
        (err, menu) => {
          res.status(201).json({ menu: menu });
        },
      );
    },
  );
});

menuRouter.param('menuID', (req, res, next, menuID) => {
  db.get(
    'SELECT * FROM Menu WHERE id = $menuID',
    { $menuID: menuID },
    (err, menu) => {
      if (err) {
        next(err);
      } else if (menu) {
        req.menu = menu;
        next();
      } else {
        res.sendStatus(404);
      }
    },
  );
});

menuRouter.get('/:menuID', (req, res, next) => {
  res.status(200).json({ menu: req.menu });
});

menuRouter.put('/:menuID', (req, res, next) => {
  const menu = req.body.menu;
  if (!menu.title) {
    return res.sendStatus(400);
  }
  db.run(
    'UPDATE Menu SET title = $title WHERE id = $id',
    {
      $title: menu.title,
      $id: req.params.menuID,
    },
    () => {
      db.get(
        'SELECT * FROM Menu WHERE id = $id',
        { $id: req.params.menuID },
        (err, updatedMenu) => {
          res.status(200).json({ menu: updatedMenu });
        },
      );
    },
  );
});

menuRouter.delete('/:menuID', (req, res, next) => {
  db.get(
    'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuID',
    { $menuID: req.params.menuID },
    (err, menuItems) => {
      if (err) {
        next(err);
      } else if (menuItems) {
        res.sendStatus(400);
      } else {
        db.run(
          'DELETE FROM Menu WHERE Menu.id = $menuID',
          { $menuID: req.params.menuID },
          (err) => {
            if (err) {
              next(err);
            } else {
              res.sendStatus(204);
            }
          },
        );
      }
    },
  );
});

menuRouter.use('/:menuID/menu-items', menuItemsRouter);

module.exports = menuRouter;
