const { Router } = require('express');

const FavourRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

FavourRouter.get('/', (req, res) => {
  res.status(200).json('server on port 9000 and database is connected');
});

FavourRouter.get('/all', (req, res) => {
  const query = `
    SELECT 
      f.id,
      f.property_id,
      COALESCE(f.unit_id, 0) AS unit_id,
      f.user_id,
      CASE
        WHEN p.property_type = 'apartment' AND unit.id IS NOT NULL
        THEN CONCAT(
            p.name,
            ' - Floor ',
            fl.floor_num,
            ' - Unit ',
            unit.unit_code
        )
        ELSE p.name
      END AS name,
      p.address,
      COALESCE(unit.rent, p.rent) AS rent,
      p.description,
      f.created_at
    FROM favourite f
    INNER JOIN properties p ON f.property_id = p.id
    LEFT JOIN unit unit ON f.unit_id = unit.id
    LEFT JOIN floor fl ON unit.floor = fl.id
  `;

  mysqlconnection.query(query, (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: "Database error" });
    }
  });
});

FavourRouter.get('/all/:id', (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT
      f.id,
      f.property_id,
      COALESCE(f.unit_id, 0) AS unit_id,
      f.user_id,
      CASE
        WHEN p.property_type = 'apartment' AND unit.id IS NOT NULL
        THEN CONCAT(
            p.name,
            ' - Floor ',
            fl.floor_num,
            ' - Unit ',
            unit.unit_code
        )
        ELSE p.name
      END AS name,
      p.address,
      COALESCE(unit.rent, p.rent) AS rent,
      p.description,
      f.created_at
    FROM favourite f
    INNER JOIN properties p ON f.property_id = p.id
    LEFT JOIN unit unit ON f.unit_id = unit.id
    LEFT JOIN floor fl ON unit.floor = fl.id
    WHERE f.user_id = ?
  `;

  mysqlconnection.query(query, [userId], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: "Database error" });
    }
  });
});

FavourRouter.post('/add', (req, res) => {
  let { property_id, unit_id, user_id, created_at } = req.body;
  
  // If unit_id is missing, null, or 0, store as 0
  const safeUnitId = (!unit_id || unit_id === 0) ? 0 : unit_id;

  console.log(req.body);

  mysqlconnection.query(
    'INSERT INTO favourite (property_id, unit_id, user_id, created_at) VALUES (?, ?, ?, ?);',
    [property_id, safeUnitId, user_id, created_at],
    (error, results) => {
      if (!error) {
        res.json({ status: 'inserted', id: results.insertId });
      } else {
        console.log(error);
        res.status(500).json({ status: 'error', error });
      }
    }
  );
});

FavourRouter.put('/update', (req, res) => {
  const { id, property_id, unit_id, user_id } = req.body;
  const safeUnitId = (!unit_id || unit_id === 0) ? null : unit_id;
  
  console.log(req.body);
  
  mysqlconnection.query(
    'UPDATE favourite SET property_id = ?, unit_id = ?, user_id = ? WHERE id = ?',
    [property_id, safeUnitId, user_id, id],
    (error) => {
      if (!error) {
        res.json({ status: 'updated' });
      } else {
        console.log(error);
        res.status(500).json({ status: 'error', error });
      }
    }
  );
});

FavourRouter.post('/delete/:id', (req, res) => {
  const id = req.params.id;
  mysqlconnection.query('DELETE FROM favourite WHERE id = ?', [id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      res.json({ status: error });
    }
  });
});

FavourRouter.post('/delete_all/:id', (req, res) => {
  const id = req.params.id;
  // If this should delete by user_id or specific id logic, adjust accordingly. Keeping original intent:
  mysqlconnection.query('DELETE FROM favourite WHERE id = ?', [id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      res.json({ status: error });
    }
  });
});

module.exports = FavourRouter;