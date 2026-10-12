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
  const {
    tenant_id,
    rent_id,
    type,
    amount,
    method,
    created_at
  } = req.body;

  console.log('Payment request:', req.body);

  if (!tenant_id || !rent_id || !amount) {
    return res.status(400).json({
      error: 'tenant_id, rent_id and amount are required'
    });
  }

  // Get the rental information first.
  const rentQuery = `
    SELECT
      id,
      tenant_id,
      move_in_date,
      period,
      lease,
      rentStatus
    FROM rented
    WHERE id = ?
    LIMIT 1
  `;

  mysqlconnection.query(rentQuery, [rent_id], (error, rentRows) => {
    if (error) {
      console.error('Error finding rented record:', error);

      return res.status(500).json({
        error: 'Failed to find rental',
        details: error.message
      });
    }

    if (rentRows.length === 0) {
      return res.status(404).json({
        error: 'Rental record not found'
      });
    }

    const rent = rentRows[0];

    // Make sure the payment belongs to the same tenant.
    if (Number(rent.tenant_id) !== Number(tenant_id)) {
      return res.status(400).json({
        error: 'This rental does not belong to this tenant'
      });
    }

    /*
     * Use the actual payment date only for created_at.
     *
     * The rent due date is calculated from move_in_date,
     * NOT from the date the tenant pays.
     */
    const paymentDate = created_at
      ? new Date(created_at)
      : new Date();

    if (Number.isNaN(paymentDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid payment date'
      });
    }

    /*
     * We calculate the current rental month using MySQL.
     *
     * Example:
     * move_in_date = 2026-08-20
     *
     * Current date = 2026-09-17
     *
     * Current rental cycle = 2026-08-20 -> 2026-09-20
     *
     * Therefore the next due date is 2026-09-20.
     */
    const cycleQuery = `
      SELECT
        DATE(
          DATE_ADD(
            r.move_in_date,
            INTERVAL (
              TIMESTAMPDIFF(
                MONTH,
                r.move_in_date,
                CURDATE()
              )
              +
              CASE
                WHEN DAY(CURDATE()) >= DAY(r.move_in_date)
                THEN 1
                ELSE 0
              END
            ) MONTH
          )
        ) AS next_due_date
      FROM rented r
      WHERE r.id = ?
      LIMIT 1
    `;

    mysqlconnection.query(cycleQuery, [rent_id], (cycleError, cycleRows) => {
      if (cycleError) {
        console.error('Error calculating rent cycle:', cycleError);

        return res.status(500).json({
          error: 'Failed to calculate rent cycle',
          details: cycleError.message
        });
      }

      if (cycleRows.length === 0) {
        return res.status(404).json({
          error: 'Unable to calculate rental cycle'
        });
      }

      const nextDueDate = cycleRows[0].next_due_date;

      /*
       * Check whether this rental cycle has already been paid.
       *
       * rent_month is the date representing the rental month/cycle.
       */
      const duplicateQuery = `
        SELECT id
        FROM payment
        WHERE rent_id = ?
          AND type = 'rent'
          AND rent_month = ?
        LIMIT 1
      `;

      mysqlconnection.query(
        duplicateQuery,
        [rent_id, nextDueDate],
        (duplicateError, duplicateRows) => {
          if (duplicateError) {
            console.error(
              'Error checking existing rent payment:',
              duplicateError
            );

            return res.status(500).json({
              error: 'Failed to check existing rent payment',
              details: duplicateError.message
            });
          }

          if (duplicateRows.length > 0) {
            return res.status(400).json({
              error: 'This rental month has already been paid',
              payment_id: duplicateRows[0].id,
              rent_month: nextDueDate
            });
          }

          const insertQuery = `
            INSERT INTO payment
            (
              tenant_id,
              rent_id,
              type,
              amount,
              method,
              status,
              rent_month,
              due_date,
              created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          mysqlconnection.query(
            insertQuery,
            [
              tenant_id,
              rent_id,
              type || 'rent',
              amount,
              method || null,
              'Paid',
              nextDueDate,
              nextDueDate,
              created_at || new Date()
            ],
            (insertError, result) => {
              if (insertError) {
                console.error('Error adding payment:', insertError);

                return res.status(500).json({
                  error: 'Failed to add payment',
                  details: insertError.message
                });
              }

              return res.status(200).json({
                message: 'Payment created successfully',
                payment_id: result.insertId,
                rent_month: nextDueDate,
                due_date: nextDueDate,
                status: 'Paid'
              });
            }
          );
        }
      );
    });
  });
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