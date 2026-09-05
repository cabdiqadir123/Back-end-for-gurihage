const { Router } = require('express');

const RentedRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

RentedRouter.get('/', (req, res) => {
  res.status(200).json('server on port 9000 and database is connected');
});

// GET ALL RENTED
RentedRouter.get('/all', (req, res) => {
  const query = `
    SELECT 
          r.id,
          r.unit_id,
          r.move_in_date,
          r.lease,
          r.period,
          r.created_at,
          r.rentStatus,
          t.id AS tenant_id,
          t.full_name AS tenant_name,
          t.email AS tenant_email,
          t.phone AS tenant_phone,
          p.id AS property_id,
          CASE
            WHEN p.property_type = 'apartment'
            THEN CONCAT(
                p.name,
                ' - Floor ',
                f.floor_num,
                ' - Unit ',
                u.unit_code
            )
            ELSE p.name
          END AS property_name,
          p.property_type,
          p.pr_code,
          p.address AS property_address,
          COALESCE(u.rent, p.rent) AS rent,
          p.floor_number,
          p.rooms,
          p.isMasterRoom,
          COALESCE(u.bedroom, p.bedroom) AS bedroom,
          COALESCE(u.living_rooms, p.living_rooms) AS living_rooms,
          COALESCE(u.bathroom, p.bathrooms) AS bathrooms,
          p.size,
          p.parking_available,

          -- Location details
          p.region_id,
          reg.name AS region_name,
          p.district_id,
          d.name AS district_name,
          p.village_id,
          v.name AS village_name,

          o.id AS owner_id,
          o.full_name AS owner_name,
          o.email AS owner_email,
          o.phone AS owner_phone,
          MAX(pay.created_at) AS last_payment,
          DATE_ADD(
              COALESCE(MAX(pay.created_at), r.move_in_date),
              INTERVAL 1 MONTH
          ) AS next_due_date,
          CASE
              WHEN DATE_ADD(COALESCE(MAX(pay.created_at), r.move_in_date), INTERVAL 1 MONTH) < CURDATE()
                  THEN 'overdue'
              WHEN DATEDIFF(
                  DATE_ADD(COALESCE(MAX(pay.created_at), r.move_in_date), INTERVAL 1 MONTH),
                  CURDATE()
              ) <= 5
                  THEN 'dueSoon'
              ELSE 'paid'
          END AS rent_status,
          DATE_ADD(r.move_in_date, INTERVAL r.period MONTH) AS lease_expiry_date,
          CASE
              WHEN DATE_ADD(r.move_in_date, INTERVAL r.period MONTH) < CURDATE()
                  THEN 'expired'
              WHEN DATEDIFF(
                  DATE_ADD(r.move_in_date, INTERVAL r.period MONTH),
                  CURDATE()
              ) <= 5
                  THEN 'expiringSoon'
              ELSE 'active'
          END AS lease_status

      FROM rented r
      LEFT JOIN payment pay ON pay.rent_id = r.id
      LEFT JOIN users t ON r.tenant_id = t.id
      LEFT JOIN properties p ON r.property_id = p.id
      LEFT JOIN regions reg ON p.region_id = reg.id
      LEFT JOIN districts d ON p.district_id = d.id
      LEFT JOIN villages v ON p.village_id = v.id
      LEFT JOIN users o ON p.owner_id = o.id
      LEFT JOIN unit u ON r.unit_id = u.id
      LEFT JOIN floor f ON u.floor = f.id
      GROUP BY r.id;
  `;

  mysqlconnection.query(query, (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: "Database query failed" });
    }
  });
});

// GET ALL RENTED BY OWNER ID
RentedRouter.get("/allowner/:id", (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT 
          r.id,
          r.unit_id,
          r.move_in_date,
          r.lease,
          r.period,
          r.created_at,
          r.rentStatus,
          t.id AS tenant_id,
          t.full_name AS tenant_name,
          t.email AS tenant_email,
          t.phone AS tenant_phone,
          p.id AS property_id,
          CASE
            WHEN p.property_type = 'apartment'
            THEN CONCAT(
                p.name,
                ' - Floor ',
                f.floor_num,
                ' - Unit ',
                u.unit_code
            )
            ELSE p.name
          END AS property_name,
          p.property_type, 
          p.pr_code,
          p.address AS property_address,
          COALESCE(u.rent, p.rent) AS rent,
          p.floor_number,
          p.rooms,
          p.isMasterRoom,
          COALESCE(u.bedroom, p.bedroom) AS bedroom,
          COALESCE(u.living_rooms, p.living_rooms) AS living_rooms,
          COALESCE(u.bathroom, p.bathrooms) AS bathrooms,
          p.size,
          p.parking_available,

          -- Location details
          p.region_id,
          reg.name AS region_name,
          p.district_id,
          d.name AS district_name,
          p.village_id,
          v.name AS village_name,

          o.id AS owner_id,
          o.full_name AS owner_name,
          o.email AS owner_email,
          o.phone AS owner_phone,
          MAX(pay.created_at) AS last_payment,
          DATE_ADD(
              COALESCE(MAX(pay.created_at), r.move_in_date),
              INTERVAL 1 MONTH
          ) AS next_due_date,
          CASE
              WHEN DATE_ADD(COALESCE(MAX(pay.created_at), r.move_in_date), INTERVAL 1 MONTH) < CURDATE()
                  THEN 'overdue'
              WHEN DATEDIFF(
                  DATE_ADD(COALESCE(MAX(pay.created_at), r.move_in_date), INTERVAL 1 MONTH),
                  CURDATE()
              ) <= 5
                  THEN 'dueSoon'
              ELSE 'paid'
          END AS rent_status,
          DATE_ADD(r.move_in_date, INTERVAL r.period MONTH) AS lease_expiry_date,
          CASE
              WHEN DATE_ADD(r.move_in_date, INTERVAL r.period MONTH) < CURDATE()
                  THEN 'expired'
              WHEN DATEDIFF(
                  DATE_ADD(r.move_in_date, INTERVAL r.period MONTH),
                  CURDATE()
              ) <= 5
                  THEN 'expiringSoon'
              ELSE 'active'
          END AS lease_status,
          (SELECT message FROM messages 
          WHERE rent_id = r.id 
          ORDER BY created_at DESC LIMIT 1) AS last_message,
          (SELECT COUNT(*) FROM messages 
          WHERE rent_id = r.id AND receiver_id = ?
            AND receiver_status = 'unread') AS unread_count
      FROM rented r
      LEFT JOIN payment pay ON pay.rent_id = r.id
      LEFT JOIN users t ON r.tenant_id = t.id
      LEFT JOIN properties p ON r.property_id = p.id
      LEFT JOIN regions reg ON p.region_id = reg.id
      LEFT JOIN districts d ON p.district_id = d.id
      LEFT JOIN villages v ON p.village_id = v.id
      LEFT JOIN users o ON p.owner_id = o.id
      LEFT JOIN unit u ON r.unit_id = u.id
      LEFT JOIN floor f ON u.floor = f.id
      WHERE o.id = ?
      GROUP BY r.id;
  `;

  mysqlconnection.query(query, [id, id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: "Database query failed" });
    }
  });
});

// GET ALL RENTED BY TENANT ID
RentedRouter.get("/alltenant/:id", (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT 
          r.id,
          r.unit_id,
          r.move_in_date,
          r.lease,
          r.period,
          r.created_at,
          r.rentStatus,
          t.id AS tenant_id,
          t.full_name AS tenant_name,
          t.email AS tenant_email,
          t.phone AS tenant_phone,
          p.id AS property_id,
          CASE
            WHEN p.property_type = 'apartment'
            THEN CONCAT(
                p.name,
                ' - Floor ',
                f.floor_num,
                ' - Unit ',
                u.unit_code
            )
            ELSE p.name
          END AS property_name,
          p.property_type,
          p.pr_code,
          p.address AS property_address,
          COALESCE(u.rent, p.rent) AS rent,
          p.floor_number,
          p.rooms,
          p.isMasterRoom,
          COALESCE(u.bedroom, p.bedroom) AS bedroom,
          COALESCE(u.living_rooms, p.living_rooms) AS living_rooms,
          COALESCE(u.bathroom, p.bathrooms) AS bathrooms,
          p.size,
          p.parking_available,

          -- Location details
          p.region_id,
          reg.name AS region_name,
          p.district_id,
          d.name AS district_name,
          p.village_id,
          v.name AS village_name,

          o.id AS owner_id,
          o.full_name AS owner_name,
          o.email AS owner_email,
          o.phone AS owner_phone,
          MAX(pay.created_at) AS last_payment,
          DATE_ADD(
              COALESCE(MAX(pay.created_at), r.move_in_date),
              INTERVAL 1 MONTH
          ) AS next_due_date,
          CASE
              WHEN DATE_ADD(COALESCE(MAX(pay.created_at), r.move_in_date), INTERVAL 1 MONTH) < CURDATE()
                  THEN 'overdue'
              WHEN DATEDIFF(
                  DATE_ADD(COALESCE(MAX(pay.created_at), r.move_in_date), INTERVAL 1 MONTH),
                  CURDATE()
              ) <= 5
                  THEN 'dueSoon'
              ELSE 'paid'
          END AS rent_status,
          DATE_ADD(r.move_in_date, INTERVAL r.period MONTH) AS lease_expiry_date,
          CASE
              WHEN DATE_ADD(r.move_in_date, INTERVAL r.period MONTH) < CURDATE()
                  THEN 'expired'
              WHEN DATEDIFF(
                  DATE_ADD(r.move_in_date, INTERVAL r.period MONTH),
                  CURDATE()
              ) <= 5
                  THEN 'expiringSoon'
              ELSE 'active'
          END AS lease_status,
          (SELECT message FROM messages 
          WHERE rent_id = r.id 
          ORDER BY created_at DESC LIMIT 1) AS last_message,
          (SELECT COUNT(*) FROM messages 
          WHERE rent_id = r.id AND receiver_id = ?
            AND receiver_status = 'unread') AS unread_count
      FROM rented r
      LEFT JOIN payment pay ON pay.rent_id = r.id
      LEFT JOIN users t ON r.tenant_id = t.id
      LEFT JOIN properties p ON r.property_id = p.id
      LEFT JOIN regions reg ON p.region_id = reg.id
      LEFT JOIN districts d ON p.district_id = d.id
      LEFT JOIN villages v ON p.village_id = v.id
      LEFT JOIN users o ON p.owner_id = o.id
      LEFT JOIN unit u ON r.unit_id = u.id
      LEFT JOIN floor f ON u.floor = f.id
      WHERE r.tenant_id = ?
      GROUP BY r.id;
  `;

  mysqlconnection.query(query, [id, id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: "Database query failed" });
    }
  });
});

RentedRouter.post('/add', (req, res) => {
  const {
    tenant_id,
    property_id,
    unit_id,
    move_in_date,
    lease,
    period,
    rentStatus,
    created_at
  } = req.body;

  console.log(req.body);

  const query = `
    INSERT INTO rented
    (tenant_id, property_id, unit_id, move_in_date, lease, period, rentStatus, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  mysqlconnection.query(
    query,
    [tenant_id, property_id, unit_id, move_in_date, lease, period, rentStatus, created_at],
    (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: error });
      }

      const insertedId = results.insertId;

      res.status(200).json({
        message: "Rented entry created successfully",
        rented_id: insertedId
      });
    }
  );
});

RentedRouter.post('/addNew', (req, res) => {
  const {
    tenant_id,
    property_id,
    move_in_date,
    lease,
    period,
    rentStatus,
    created_at
  } = req.body;

  console.log(req.body);

  const query = `
    INSERT INTO rented
    (tenant_id, property_id, move_in_date, lease, period, rentStatus, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  mysqlconnection.query(
    query,
    [tenant_id, property_id, move_in_date, lease, period, rentStatus, created_at],
    (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to insert rented entry" });
      }

      const insertedId = results.insertId;

      res.status(200).json({
        message: "Rented entry created successfully",
        booking_id: insertedId
      });
    }
  );
});

RentedRouter.put('/updatestatus/:id', (req, res) => {
  const id = req.params.id;
  const { rentStatus } = req.body;

  if (!rentStatus) {
    return res.status(400).json({ error: "status is required" });
  }

  const query = `
    UPDATE rented
    SET rentStatus = ?
    WHERE id = ?;
  `;

  mysqlconnection.query(query, [rentStatus, id], (error, result) => {
    if (error) {
      console.error("Error updating status:", error);
      return res.status(500).json({ error: "Failed to update status", details: error });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Rented record not found" });
    }

    res.status(200).json({
      message: "Rented status updated successfully",
      id: id,
      new_status: rentStatus
    });
  });
});

RentedRouter.put('/updatelease/:id', (req, res) => {
  const id = req.params.id;
  const { lease } = req.body;
  console.log(req.body);
  mysqlconnection.query('UPDATE rented SET lease=? WHERE id=?'
    , [lease, id], (error, rows, fields) => {
      if (!error) {
        res.json({ status: 'updated' });
      } else {
        console.log(error);
        res.status(500).json({ error: "Update failed" });
      }
    });
});

RentedRouter.post('/delete', (req, res) => {
  const { supplier_id } = req.body;
  console.log(req.body);
  mysqlconnection.query('DELETE FROM rented WHERE id=?'
    , [supplier_id], (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        res.status(500).json({ status: error });
      }
    });
});

module.exports = RentedRouter;