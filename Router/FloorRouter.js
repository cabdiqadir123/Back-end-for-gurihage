const { Router } = require('express');

const FloorRouter = Router();
const mysqlconnection = require('../dstsbase/database.js');

FloorRouter.get('/', (req, res) => {
  res.status(200).json('Floor API running');
});

// Get all floors
FloorRouter.get('/all', (req, res) => {
  const sql = `
    SELECT
      f.id AS floor_id,
      f.floor_num,
      f.property_id,
      f.status AS floor_status,
      f.created_at AS floor_created_at,

      u.id AS unit_id,
      u.unit_code,
      u.floor,
      u.rent,
      u.deposit,
      u.bedroom,
      u.bathroom,
      u.living_rooms,
      u.kitchens,
      u.status AS unit_status,
      u.created_at AS unit_created_at

    FROM floor f
    LEFT JOIN unit u
      ON u.floor = f.id

    ORDER BY f.floor_num ASC, u.unit_code ASC
  `;

  mysqlconnection.query(sql, (err, rows) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    const floors = [];

    rows.forEach(row => {
      let floor = floors.find(f => f.id === row.floor_id);

      if (!floor) {
        floor = {
          id: row.floor_id,
          floor_num: row.floor_num,
          property_id: row.property_id,
          status: row.floor_status,
          created_at: row.floor_created_at,
          units: []
        };

        floors.push(floor);
      }

      if (row.unit_id != null) {
        floor.units.push({
          id: row.unit_id,
          unit_code: row.unit_code,
          floor: row.floor,
          property_id: row.property_id,
          rent: row.rent,
          deposit: row.deposit,
          bedroom: row.bedroom,
          bathroom: row.bathroom,
          living_rooms: row.living_rooms,
          kitchens: row.kitchens,
          status: row.unit_status,
          created_at: row.unit_created_at
        });
      }
    });

    res.json(floors);
  });
});

FloorRouter.get('/property/:id', (req, res) => {
    const propertyId = req.params.id;

    const sql = `
      SELECT
        f.id AS floor_id,
        f.floor_num,
        f.property_id,
        f.status AS floor_status,
        f.created_at AS floor_created_at,

        u.id AS unit_id,
        u.unit_code,
        u.floor,
        u.property_id,
        p.title AS property_name,
        u.rent,
        u.deposit,
        u.bedroom,
        u.bathroom,
        u.living_rooms,
        u.kitchens,
        u.status AS unit_status,
        u.created_at AS unit_created_at

      FROM floor f

      LEFT JOIN unit u
        ON u.floor = f.id

      LEFT JOIN properties p
        ON p.id = u.property_id

      WHERE f.property_id = ?

      ORDER BY f.floor_num ASC, u.unit_code ASC
    `;

    mysqlconnection.query(sql, [propertyId], (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        const floors = [];

        rows.forEach(row => {

            let floor = floors.find(f => f.id === row.floor_id);

            if (!floor) {

                floor = {
                    id: row.floor_id,
                    floor_num: row.floor_num,
                    property_id: row.property_id,
                    status: row.floor_status,
                    created_at: row.floor_created_at,
                    units: []
                };

                floors.push(floor);
            }

            if (row.unit_id != null) {

                floor.units.push({
                    id: row.unit_id,
                    unit_code: row.unit_code,
                    floor: row.floor,
                    property_id: row.property_id,
                    property_name: row.property_name,
                    rent: row.rent,
                    deposit: row.deposit,
                    bedroom: row.bedroom,
                    bathroom: row.bathroom,
                    living_rooms: row.living_rooms,
                    kitchens: row.kitchens,
                    status: row.unit_status,
                    created_at: row.unit_created_at
                });
            }

        });

        res.json(floors);

    });
});

// Add floor
FloorRouter.post('/add', (req, res) => {
  const {
    floor_num,
    property_id,
    status,
    created_at
  } = req.body;

  mysqlconnection.query(
    `SELECT id
     FROM floor
     WHERE property_id = ?
     AND floor_num = ?`,
    [property_id, floor_num],
    (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Database error"
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Floor number is already taken."
        });
      }

      mysqlconnection.query(
        `INSERT INTO floor
        (floor_num, property_id, status, created_at)
        VALUES (?,?,?,?)`,
        [
          floor_num,
          property_id,
          status,
          created_at
        ],
        (error, rows) => {
          if (error) {
            console.log(error);
            return res.status(500).json({
              success: false,
              message: "Failed to add floor."
            });
          }

          return res.json({
            success: true,
            status: rows.insertId
          });
        }
      );
    }
  );
});

// Update floor
FloorRouter.post('/update/:id', (req, res) => {

  const id = req.params.id;

  const {
    floor_num,
    status
  } = req.body;

  mysqlconnection.query(
    `UPDATE floor
    SET floor_num=?,
        status=?
    WHERE id=?`,
    [
      floor_num,
      status,
      id
    ],
    (error) => {
      if (!error) {
        res.json({
          status: 'updated'
        });
      } else {
        console.log(error);
      }
    }
  );
});

// Delete floor
FloorRouter.post('/delete/:id', (req, res) => {

  mysqlconnection.query(
    'DELETE FROM floor WHERE id=?',
    [req.params.id],
    (error) => {
      if (!error) {
        res.json({
          id: Number(req.params.id)
        });
      } else {
        console.log(error);
      }
    }
  );
});

module.exports = FloorRouter;