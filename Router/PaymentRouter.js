const { Router } = require('express');

const PaymentRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

PaymentRouter.get('/', (req, res) => {
  res.status(200).json('server on port 9000 and database is connected');
});

PaymentRouter.get('/all', (req, res) => {
  const query = `
    SELECT 
      p.*,

      -- Unit details from rented
      r.unit_id,
      unit.unit_code,
      fl.floor_num,

      -- Property details & formatting
      pr.id AS property_id,
      pr.owner_id,
      CASE 
        WHEN pr.property_type = 'apartment' 
        THEN CONCAT(
          pr.name, 
          ' - Floor ', 
          fl.floor_num, 
          ' - Unit ', 
          unit.unit_code
        )
        ELSE pr.name 
      END AS property_name,
      pr.address AS property_address,

      -- Location details
      pr.region_id,
      reg.name AS region_name,
      pr.district_id,
      d.name AS district_name,
      pr.village_id,
      v.name AS village_name,

      -- Tenant
      u.id AS tenant_id,
      u.full_name AS tenant_name,
      u.phone AS tenant_phone,

      -- Owner
      o.id AS owner_id,
      o.full_name AS owner_name,
      o.phone AS owner_phone

    FROM payment p
    JOIN rented r ON p.rent_id = r.id
    LEFT JOIN unit unit ON r.unit_id = unit.id
    LEFT JOIN floor fl ON unit.floor = fl.id
    LEFT JOIN properties pr ON r.property_id = pr.id
    LEFT JOIN regions reg ON pr.region_id = reg.id
    LEFT JOIN districts d ON pr.district_id = d.id
    LEFT JOIN villages v ON pr.village_id = v.id
    LEFT JOIN users u ON r.tenant_id = u.id
    LEFT JOIN users o ON pr.owner_id = o.id
    ORDER BY p.id DESC;
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

PaymentRouter.get('/user/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      p.*,

      -- Unit details from rented
      r.unit_id,
      unit.unit_code,
      fl.floor_num,

      -- Property details & formatting
      pr.id AS property_id,
      pr.owner_id,
      CASE 
        WHEN pr.property_type = 'apartment' 
        THEN CONCAT(
          pr.name, 
          ' - Floor ', 
          fl.floor_num, 
          ' - Unit ', 
          unit.unit_code
        )
        ELSE pr.name 
      END AS property_name,
      pr.address AS property_address,

      -- Location details
      pr.region_id,
      reg.name AS region_name,
      pr.district_id,
      d.name AS district_name,
      pr.village_id,
      v.name AS village_name,

      -- Tenant
      u.id AS tenant_id,
      u.full_name AS tenant_name,
      u.phone AS tenant_phone,

      -- Owner
      o.id AS owner_id,
      o.full_name AS owner_name,
      o.phone AS owner_phone

    FROM payment p
    JOIN rented r ON p.rent_id = r.id
    LEFT JOIN unit unit ON r.unit_id = unit.id
    LEFT JOIN floor fl ON unit.floor = fl.id
    LEFT JOIN properties pr ON r.property_id = pr.id
    LEFT JOIN regions reg ON pr.region_id = reg.id
    LEFT JOIN districts d ON pr.district_id = d.id
    LEFT JOIN villages v ON pr.village_id = v.id
    LEFT JOIN users u ON r.tenant_id = u.id
    LEFT JOIN users o ON pr.owner_id = o.id
    WHERE r.tenant_id = ? OR pr.owner_id = ?
    ORDER BY p.created_at DESC;
  `;

  mysqlconnection.query(query, [id, id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.error("Error fetching user payments:", error);
      res.status(500).json({ error: "Database error" });
    }
  });
});

PaymentRouter.get('/by_owner/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      payment.*, 
      properties.owner_id,
      properties.name AS property_name,
      properties.address AS property_address,
      properties.region_id,
      reg.name AS region_name,
      properties.district_id,
      d.name AS district_name,
      properties.village_id,
      v.name AS village_name,
      users.full_name AS owner_name,
      users.email AS owner_email
    FROM payment
    JOIN rented ON payment.rent_id = rented.id
    JOIN properties ON rented.property_id = properties.id
    LEFT JOIN regions reg ON properties.region_id = reg.id
    LEFT JOIN districts d ON properties.district_id = d.id
    LEFT JOIN villages v ON properties.village_id = v.id
    JOIN users ON properties.owner_id = users.id
    WHERE users.id = ?
    ORDER BY payment.id DESC;
  `;

  mysqlconnection.query(query, [id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.error(error);
      res.status(500).json({ error: 'Database query failed' });
    }
  });
});

PaymentRouter.get('/by_tenant/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      payment.*, 
      properties.owner_id,
      properties.name AS property_name,
      properties.address AS property_address,
      properties.region_id,
      reg.name AS region_name,
      properties.district_id,
      d.name AS district_name,
      properties.village_id,
      v.name AS village_name,
      users.full_name AS owner_name,
      users.email AS owner_email
    FROM payment
    JOIN rented ON payment.rent_id = rented.id
    JOIN properties ON rented.property_id = properties.id
    LEFT JOIN regions reg ON properties.region_id = reg.id
    LEFT JOIN districts d ON properties.district_id = d.id
    LEFT JOIN villages v ON properties.village_id = v.id
    JOIN users ON properties.owner_id = users.id
    WHERE payment.tenant_id = ?
    ORDER BY payment.id DESC;
  `;

  mysqlconnection.query(query, [id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.error(error);
      res.status(500).json({ error: 'Database query failed' });
    }
  });
});

PaymentRouter.get('/by-rent/:id', (req, res) => {
  const { id } = req.params;
  mysqlconnection.query('SELECT * FROM payment WHERE rent_id=?', [id], (error, rows, fields) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: 'Database query failed' });
    }
  });
});

PaymentRouter.get('/trend', (req, res) => {
  const query = `
    SELECT 
      DATE_FORMAT(created_at, '%b') AS month,
      MONTH(created_at) AS month_num,
      SUM(amount) AS amount
    FROM payment
    WHERE type = 'rent' AND YEAR(created_at) = YEAR(CURDATE())
    GROUP BY month_num, month
    ORDER BY month_num ASC
  `;

  mysqlconnection.query(query, (error, rows) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Database query failed", error });
    }
    res.json(rows);
  });
});

PaymentRouter.post('/add', (req, res) => {
  const { tenant_id, rent_id, type, amount, method, created_at } = req.body;
  console.log(req.body);
  mysqlconnection.query(
    'INSERT INTO payment (tenant_id, rent_id, type, amount, method, created_at) VALUES(?, ?, ?, ?, ?, ?);',
    [tenant_id, rent_id, type, amount, method, created_at],
    (error, rows, fields) => {
      if (!error) {
        const insertedId = rows.insertId;

        res.status(200).json({
          message: "payment created successfully",
          payment_id: insertedId
        });
      } else {
        console.log(error);
        res.status(500).json({ error: 'Failed to add payment' });
      }
    }
  );
});

PaymentRouter.put('/update/:id', (req, res) => {
  const id = req.params.id;
  const { method } = req.body;

  const query = `
    UPDATE payment  
    SET method = ?
    WHERE id = ?;
  `;

  mysqlconnection.query(query, [method, id], (error, result) => {
    if (error) {
      console.error('Error updating payment:', error);
      return res.status(500).json({
        error: 'Failed to update payment',
        details: error.message,
        body: req.body
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'payment not found' });
    }

    res.status(200).json({
      message: 'payment updated successfully',
      id: id,
      body: req.body
    });
  });
});

PaymentRouter.post('/delete/:id', (req, res) => {
  const id = req.params.id;
  mysqlconnection.query('DELETE FROM payment WHERE id = ?', [id], (error, rows, fields) => {
    if (!error) {
      res.json(rows);
    } else {
      res.json({ status: error });
    }
  });
});

PaymentRouter.post('/delete_all/:id', (req, res) => {
  const id = req.params.id;
  mysqlconnection.query('DELETE FROM payment WHERE rent_id = ?', [id], (error, rows, fields) => {
    if (!error) {
      res.json(rows);
    } else {
      res.json({ status: error });
    }
  });
});

module.exports = PaymentRouter;