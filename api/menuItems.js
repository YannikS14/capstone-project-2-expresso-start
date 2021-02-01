const express = require('express');
const menuItemsRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite',
);

menuItemsRouter.get('/', (req, res, next) => {
  db.all(
    'SELECT * FROM MenuItem WHERE menu_id = $menuID',
    {
      $menuID: req.params.menuID,
    },
    (err, menuItems) => {
      res.status(200).json({ menuItems: menuItems });
    },
  );
});

menuItemsRouter.post('/', (req, res, next) => {
  const menuItem = req.body.menuItem;
  if (!menuItem.name || !menuItem.inventory || !menuItem.price) {
    return res.sendStatus(400);
  }
  db.run(
    'INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuID)',
    {
      $name: menuItem.name,
      $description: menuItem.description,
      $inventory: menuItem.inventory,
      $price: menuItem.price,
      $menuID: req.params.menuID,
    },
    function (err) {
      db.get(
        'SELECT * FROM MenuItem WHERE id = $lastID',
        { $lastID: this.lastID },
        (err, menuItem) => {
          res.status(201).json({ menuItem: menuItem });
        },
      );
    },
  );
});

menuItemsRouter.param('menuItemID', (req, res, next, menuItemID) => {
  db.get(
    'SELECT * FROM MenuItem WHERE id = $menuItemID',
    { $menuItemID: menuItemID },
    (err, menuItem) => {
      if (err) {
        next(err);
      } else if (menuItem) {
        req.menuItem = menuItem;
        next();
      } else {
        res.sendStatus(404);
      }
    },
  );
});

menuItemsRouter.put('/:menuItemID', (req, res, next) => {
  const menuItem = req.body.menuItem;
  if (!menuItem.name || !menuItem.inventory || !menuItem.price) {
    return res.sendStatus(400);
  }
  db.run(
    'UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuID WHERE id = $menuItemID',
    {
      $name: menuItem.name,
      $description: menuItem.description,
      $inventory: menuItem.inventory,
      $price: menuItem.price,
      $menuID: req.params.menuID,
      $menuItemID: req.params.menuItemID,
    },
    () => {
      db.get(
        'SELECT * FROM MenuItem WHERE id = $menuItemID',
        { $menuItemID: req.params.menuItemID },
        (err, updatedMenuItem) => {
          res.status(200).json({ menuItem: updatedMenuItem });
        },
      );
    },
  );
});

menuItemsRouter.delete('/:menuItemID', (req, res, next) => {
  db.run(
    'DELETE FROM MenuItem WHERE id = $menuItemID',
    { $menuItemID: req.params.menuItemID },
    () => {
      res.sendStatus(204);
    },
  );
});

module.exports = menuItemsRouter;
