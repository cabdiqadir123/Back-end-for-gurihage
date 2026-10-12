const { Router } = require('express');

const BookingRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

BookingRouter.get('/', (req, res) => {
  res.status(200).json('server on port 9000 and database is connected');
});

// GET ALL BOOKINGS (Includes Village, Region, District)
BookingRouter.get('/all', (req, res) => {
  const query = `
  SELECT
          b.id,
          b.unit_id,
          b.move_in_date,
          b.duration,
          b.desciption,
          b.status,
          b.document_id,
          b.created_at,
          tenant.id AS tenant_id,
          tenant.full_name AS tenant_name,
          tenant.phone AS tenant_phone,
          tenant.email AS tenant_email,
          tenant.region AS tenant_region,
          tenant.district AS tenant_district,
          p.id AS property_id,
          CASE
              WHEN p.property_type = 'apartment'
              THEN CONCAT(
                  p.name,
                  ' - Floor ',
                  fl.floor_num,
                  ' - Unit ',
                  unit.unit_code
              )
              ELSE p.name
          END AS property_name,
          p.property_type,
          p.address,
          COALESCE(unit.rent, p.rent) AS rent,
          COALESCE(unit.deposit, p.deposit) AS deposit,
          COALESCE(unit.bedroom, p.bedroom) AS bedroom,
          COALESCE(unit.bathroom, p.bathrooms) AS bathrooms,
          COALESCE(unit.living_rooms, p.living_rooms) AS living_rooms,
          COALESCE(unit.kitchens, p.kitchens) AS kitchens,
          p.floor_number,
          p.rooms,
          p.isMasterRoom,
          p.size,
          p.parking_available,
          r.name AS region_name,
          d.name AS district_name,
          p.village_id,
          v.name AS village_name,
          owner.id AS owner_id,
          owner.full_name AS owner_name,
          owner.phone AS owner_phone,
          owner.email AS owner_email,
          owner.region AS owner_region,
          owner.district AS owner_district
      FROM bookings b
      INNER JOIN users tenant
          ON b.tenant_id = tenant.id
      INNER JOIN properties p
          ON b.property_id = p.id
      LEFT JOIN unit unit
          ON b.unit_id = unit.id
      LEFT JOIN floor fl
          ON unit.floor = fl.id
      INNER JOIN users owner
          ON p.owner_id = owner.id
      LEFT JOIN regions r
          ON p.region_id = r.id
      LEFT JOIN districts d
          ON p.district_id = d.id
      LEFT JOIN villages v
          ON p.village_id = v.id
      ORDER BY b.id DESC;
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

// GET BOOKING BY ID
BookingRouter.get("/all/:id", (req, res) => {
  const book_id = req.params.id;
  const query = `
  SELECT
          b.id,
          b.unit_id,
          b.move_in_date,
          b.duration,
          b.desciption,
          b.status,
          b.document_id,
          b.created_at,
          tenant.id AS tenant_id,
          tenant.full_name AS tenant_name,
          tenant.phone AS tenant_phone,
          tenant.email AS tenant_email,
          tenant.region AS tenant_region,
          tenant.district AS tenant_district,
          p.id AS property_id,
          CASE
              WHEN p.property_type = 'apartment'
              THEN CONCAT(
                  p.name,
                  ' - Floor ',
                  fl.floor_num,
                  ' - Unit ',
                  unit.unit_code
              )
              ELSE p.name
          END AS property_name,
          p.property_type,
          p.address,
          COALESCE(unit.rent, p.rent) AS rent,
          COALESCE(unit.deposit, p.deposit) AS deposit,
          COALESCE(unit.bedroom, p.bedroom) AS bedroom,
          COALESCE(unit.bathroom, p.bathrooms) AS bathrooms,
          COALESCE(unit.living_rooms, p.living_rooms) AS living_rooms,
          COALESCE(unit.kitchens, p.kitchens) AS kitchens,
          p.floor_number,
          p.rooms,
          p.isMasterRoom,
          p.size,
          p.parking_available,
          r.name AS region_name,
          d.name AS district_name,
          p.village_id,
          v.name AS village_name,
          owner.id AS owner_id,
          owner.full_name AS owner_name,
          owner.phone AS owner_phone,
          owner.email AS owner_email,
          owner.region AS owner_region,
          owner.district AS owner_district
      FROM bookings b
      INNER JOIN users tenant
          ON b.tenant_id = tenant.id
      INNER JOIN properties p
          ON b.property_id = p.id
      LEFT JOIN unit unit
          ON b.unit_id = unit.id
      LEFT JOIN floor fl
          ON unit.floor = fl.id
      INNER JOIN users owner
          ON p.owner_id = owner.id
      LEFT JOIN regions r
          ON p.region_id = r.id
      LEFT JOIN districts d
          ON p.district_id = d.id
      LEFT JOIN villages v
          ON p.village_id = v.id
      WHERE b.id = ?
      ORDER BY b.id DESC;
  `;

  mysqlconnection.query(query, [book_id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: "Database query failed" });
    }
  });
});

// GET BOOKINGS BY TENANT ID
BookingRouter.get("/tenant/:id", (req, res) => {
  const tenant_id = req.params.id;
  const query = `
  SELECT
          b.id,
          b.unit_id,
          b.move_in_date,
          b.duration,
          b.desciption,
          b.status,
          b.document_id,
          b.created_at,
          tenant.id AS tenant_id,
          tenant.full_name AS tenant_name,
          tenant.phone AS tenant_phone,
          tenant.email AS tenant_email,
          tenant.region AS tenant_region,
          tenant.district AS tenant_district,
          p.id AS property_id,
          CASE
              WHEN p.property_type = 'apartment'
              THEN CONCAT(
                  p.name,
                  ' - Floor ',
                  fl.floor_num,
                  ' - Unit ',
                  unit.unit_code
              )
              ELSE p.name
          END AS property_name,
          p.property_type,
          p.address,
          COALESCE(unit.rent, p.rent) AS rent,
          COALESCE(unit.deposit, p.deposit) AS deposit,
          COALESCE(unit.bedroom, p.bedroom) AS bedroom,
          COALESCE(unit.bathroom, p.bathrooms) AS bathrooms,
          COALESCE(unit.living_rooms, p.living_rooms) AS living_rooms,
          COALESCE(unit.kitchens, p.kitchens) AS kitchens,
          p.floor_number,
          p.rooms,
          p.isMasterRoom,
          p.size,
          p.parking_available,
          r.name AS region_name,
          d.name AS district_name,
          p.village_id,
          v.name AS village_name,
          owner.id AS owner_id,
          owner.full_name AS owner_name,
          owner.phone AS owner_phone,
          owner.email AS owner_email,
          owner.region AS owner_region,
          owner.district AS owner_district
      FROM bookings b
      INNER JOIN users tenant
          ON b.tenant_id = tenant.id
      INNER JOIN properties p
          ON b.property_id = p.id
      LEFT JOIN unit unit
          ON b.unit_id = unit.id
      LEFT JOIN floor fl
          ON unit.floor = fl.id
      INNER JOIN users owner
          ON p.owner_id = owner.id
      LEFT JOIN regions r
          ON p.region_id = r.id
      LEFT JOIN districts d
          ON p.district_id = d.id
      LEFT JOIN villages v
          ON p.village_id = v.id
      WHERE b.tenant_id = ?
      ORDER BY b.id DESC;
  `;

  mysqlconnection.query(query, [tenant_id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: "Database query failed" });
    }
  });
});

// GET BOOKINGS BY PROPERTY ID
BookingRouter.get("/property/:id", (req, res) => {
  const property_id = req.params.id;
  const query = `
  SELECT 
      b.id,
      b.move_in_date,
      b.duration,
      b.desciption,
      b.status,
      b.document_id,
      b.created_at,

      -- Tenant info
      tenant.id AS tenant_id,
      tenant.full_name AS tenant_name,
      tenant.phone AS tenant_phone,
      tenant.email AS tenant_email,
      tenant.region AS tenant_region,
      tenant.district AS tenant_district,

      -- Property info
      p.id AS property_id,
      p.name AS property_name,
      p.property_type,
      p.address,
      p.rent,
      p.deposit,
      p.bedroom,
      p.bathrooms,

      -- Region, District & Village
      r.name AS region_name,
      d.name AS district_name,
      p.village_id,
      v.name AS village_name,

      -- Owner info
      owner.id AS owner_id,
      owner.full_name AS owner_name,
      owner.phone AS owner_phone,
      owner.email AS owner_email,
      owner.region AS owner_region,
      owner.district AS owner_district

  FROM bookings b

  INNER JOIN users tenant 
      ON b.tenant_id = tenant.id

  INNER JOIN properties p 
      ON b.property_id = p.id

  INNER JOIN users owner 
      ON p.owner_id = owner.id

  LEFT JOIN regions r 
      ON p.region_id = r.id

  LEFT JOIN districts d 
      ON p.district_id = d.id

  LEFT JOIN villages v 
      ON p.village_id = v.id

  WHERE p.id = ?

  ORDER BY b.id DESC
  `;

  mysqlconnection.query(query, [property_id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: "Database query failed" });
    }
  });
});

BookingRouter.get('/all_booking_sub_services', (req, res) => {
  mysqlconnection.query("SELECT id, book_id, booking_sub_services.sub_service_id, sub_service, item, price FROM sub_services INNER JOIN booking_sub_services ON booking_sub_services.sub_service_id = sub_services.sub_service_id",
    (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        console.log(error);
      }
    });
});

BookingRouter.get('/all_booking_sub_services/:id', (req, res) => {
  const id = req.params.id;
  mysqlconnection.query("SELECT id, book_id, booking_sub_services.sub_service_id, sub_service, item, price FROM sub_services INNER JOIN booking_sub_services ON booking_sub_services.sub_service_id = sub_services.sub_service_id WHERE book_id = ?",
    [id], (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        console.log(error);
      }
    });
});

BookingRouter.get('/pending/all', (req, res) => {
  mysqlconnection.query('SELECT * FROM bookings WHERE status = "Pending"', (error, rows, fields) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
    }
  });
});

BookingRouter.get('/progress/all', (req, res) => {
  mysqlconnection.query('SELECT * FROM bookings WHERE status = "in-progress"', (error, rows, fields) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
    }
  });
});

BookingRouter.get('/approved/all', (req, res) => {
  mysqlconnection.query('SELECT * FROM bookings WHERE status = "approved"', (error, rows, fields) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
    }
  });
});

BookingRouter.get('/rejected/all', (req, res) => {
  mysqlconnection.query('SELECT * FROM bookings WHERE status = "rejected"', (error, rows, fields) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
    }
  });
});

BookingRouter.get('/volume', (req, res) => {
  const query = `
    SELECT 
      DATE_FORMAT(created_at, '%b') AS month,
      MONTH(created_at) AS month_num,
      COUNT(id) AS bookings
    FROM bookings
    WHERE YEAR(created_at) = YEAR(CURDATE())
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

BookingRouter.get('/volume-report', (req, res) => {
  const query = `
    SELECT
      p.property_type AS type,
      COUNT(b.id) AS value
    FROM bookings b
    INNER JOIN properties p
      ON b.property_id = p.id
    GROUP BY p.property_type
    ORDER BY value DESC
  `;

  mysqlconnection.query(query, (error, rows) => {
    if (error) {
      console.error("Booking volume report error:", error);

      return res.status(500).json({
        message: "Database query failed",
        error: error.message
      });
    }

    const colors = {
      apartment: '#19B65B',
      villa: '#FFA500',
      home: '#3B82F6',
      floor: '#8B5CF6'
    };

    const totalBookings = rows.reduce(
      (sum, row) => sum + Number(row.value || 0),
      0
    );

    const formattedData = rows.map(row => {
      const type = row.type || 'Unknown';
      const count = Number(row.value || 0);

      return {
        type,
        value: totalBookings > 0
          ? Math.round((count / totalBookings) * 100)
          : 0,
        count,
        color:
          colors[String(type).toLowerCase()] || '#8884d8'
      };
    });

    res.json(formattedData);
  });
});

BookingRouter.post('/add', (req, res) => {
  let {
    tenant_id,
    property_id,
    unit_id,
    move_in_date,
    duration,
    desciption,
    status,
    document_id,
    created_at
  } = req.body;

  unit_id = unit_id ?? 0;

  console.log(req.body);

  const query = `
    INSERT INTO bookings
    (
      tenant_id,
      property_id,
      unit_id,
      move_in_date,
      duration,
      desciption,
      status,
      document_id,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  mysqlconnection.query(
    query,
    [
      tenant_id,
      property_id,
      unit_id,
      move_in_date,
      duration,
      desciption,
      status,
      document_id,
      created_at
    ],
    (error, results) => {
      if (error) {
        console.log(error);

        return res.status(500).json({
          success: false,
          message: error.sqlMessage || error.message,
          code: error.code,
          sqlState: error.sqlState,
        });
      }

      res.status(200).json({
        message: "Booking created successfully",
        booking_id: results.insertId,
      });
    }
  );
});

BookingRouter.post('/addNew', (req, res) => {
  let {
    tenant_id,
    property_id,
    unit_id,
    move_in_date,
    duration,
    desciption,
    status,
    document_id,
    created_at
  } = req.body;

  unit_id = unit_id ?? 0;

  console.log(req.body);

  // If document_id is missing/null, find the tenant's first document
  const findDocument = (callback) => {
    if (document_id !== null && document_id !== undefined && document_id !== '') {
      return callback(null);
    }

    const documentQuery = `
      SELECT id
      FROM documents
      WHERE user_id = ?
      ORDER BY id ASC
      LIMIT 1
    `;

    mysqlconnection.query(
      documentQuery,
      [tenant_id],
      (error, rows) => {
        if (error) {
          return callback(error);
        }

        if (rows.length > 0) {
          document_id = rows[0].id;
        } else {
          // No document found
          document_id = null;
        }

        callback(null);
      }
    );
  };

  findDocument((documentError) => {
    if (documentError) {
      console.log(documentError);

      return res.status(500).json({
        success: false,
        message: documentError.sqlMessage || documentError.message,
        code: documentError.code,
        sqlState: documentError.sqlState,
      });
    }

    console.log("Final document_id:", document_id);

    const query = `
      INSERT INTO bookings
      (
        tenant_id,
        property_id,
        unit_id,
        move_in_date,
        duration,
        desciption,
        status,
        document_id,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    mysqlconnection.query(
      query,
      [
        tenant_id,
        property_id,
        unit_id,
        move_in_date,
        duration,
        desciption,
        status,
        document_id,
        created_at
      ],
      (error, results) => {
        if (error) {
          console.log(error);

          return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message,
            code: error.code,
            sqlState: error.sqlState,
          });
        }

        res.status(200).json({
          success: true,
          message: "Booking created successfully",
          booking_id: results.insertId,
          document_id: document_id
        });
      }
    );
  });
});

BookingRouter.put('/updatestatus/:id', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  const query = `
    UPDATE bookings
    SET status = ?
    WHERE id = ?;
  `;

  mysqlconnection.query(query, [status, id], (error, result) => {
    if (error) {
      console.error("Error updating status:", error);
      return res.status(500).json({ error: "Failed to update status", details: error });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking status updated successfully",
      id: id,
      new_status: status
    });
  });
});

BookingRouter.put('/updateduration/:id', (req, res) => {
  const id = req.params.id;
  const { duration } = req.body;
  console.log(req.body);
  mysqlconnection.query('UPDATE bookings SET duration=? WHERE id=?'
    , [duration, id], (error, rows, fields) => {
      if (!error) {
        res.json({ status: 'updated' });
      } else {
        console.log(error);
      }
    });
});

BookingRouter.put('/updatedurationNew/:id', (req, res) => {
  const id = req.params.id;
  const { duration } = req.body;

  console.log(req.body);

  mysqlconnection.query(
    'UPDATE bookings SET duration = ? WHERE id = ?',
    [duration, id],
    (error, results) => {
      if (!error) {
        res.json({ status: 'updated', id });
      } else {
        console.log(error);
        res.status(500).json({ status: 'error', error: error.message });
      }
    }
  );
});

BookingRouter.post('/delete', (req, res) => {
  const { supplier_id } = req.body;
  console.log(req.body);
  mysqlconnection.query('DELETE FROM bookings WHERE id = ?'
    , [supplier_id], (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        res.json({ status: error });
      }
    });
});

module.exports = BookingRouter;