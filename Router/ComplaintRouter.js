const { Router } = require('express')

const ComplaintRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

ComplaintRouter.get('/', (req, res) => {
  res.status(200).json('server on port 9000 and database is connected');
});

ComplaintRouter.get('/all', (req, res) => {

  const query = `
    SELECT
        c.id,
        c.unit_id,
        c.category,
        c.title,
        c.description,
        c.status,
        c.resolution_note,
        c.attachment,
        c.technician,
        c.created_at,
        c.reviewed_at,
        c.assigned_at,
        c.resolved_at,
        c.rejected_at,


        -- Tenant
        t.id AS tenant_id,
        t.full_name AS tenant_name,
        t.phone AS tenant_phone,
        t.address AS tenant_address,

        -- Property
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
        p.address AS property_address,

        -- Owner
        o.id AS owner_id,
        o.full_name AS owner_name,
        o.phone AS owner_phone

    FROM complaints c

    LEFT JOIN users t
        ON c.tenant_id = t.id

    LEFT JOIN properties p
        ON c.property_id = p.id

    LEFT JOIN unit unit
        ON c.unit_id = unit.id

    LEFT JOIN floor fl
        ON unit.floor = fl.id

    LEFT JOIN users o
        ON p.owner_id = o.id;
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

ComplaintRouter.get('/user/:id', (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT
        c.id,
        c.unit_id,
        c.category,
        c.title,
        c.description,
        c.status,
        c.resolution_note,
        c.attachment,
        c.technician,
        c.created_at,
        c.reviewed_at,
        c,assigned_at,
        c.resolved_at,
        c.rejected_at,

        -- Tenant
        t.id AS tenant_id,
        t.full_name AS tenant_name,
        t.phone AS tenant_phone,
        t.address AS tenant_address,

        -- Property
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
        p.address AS property_address,

        -- Owner
        o.id AS owner_id,
        o.full_name AS owner_name,
        o.phone AS owner_phone

    FROM complaints c

    LEFT JOIN users t
        ON c.tenant_id = t.id

    LEFT JOIN properties p
        ON c.property_id = p.id

    LEFT JOIN unit unit
        ON c.unit_id = unit.id

    LEFT JOIN floor fl
        ON unit.floor = fl.id

    LEFT JOIN users o
        ON p.owner_id = o.id
        where t.id =?
  `;

  mysqlconnection.query(query,[id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: "Database error" });
    }
  });

});

ComplaintRouter.get('/owner/:id', (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT
        c.id,
        c.unit_id,
        c.category,
        c.title,
        c.description,
        c.status,
        c.resolution_note,
        c.attachment,
        c.technician,
        c.created_at,
        c.reviewed_at,
        c,assigned_at,
        c.resolved_at,
        c.rejected_at,


        -- Tenant
        t.id AS tenant_id,
        t.full_name AS tenant_name,
        t.phone AS tenant_phone,
        t.address AS tenant_address,

        -- Property
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
        p.address AS property_address,

        -- Owner
        o.id AS owner_id,
        o.full_name AS owner_name,
        o.phone AS owner_phone

    FROM complaints c

    LEFT JOIN users t
        ON c.tenant_id = t.id

    LEFT JOIN properties p
        ON c.property_id = p.id

    LEFT JOIN unit unit
        ON c.unit_id = unit.id

    LEFT JOIN floor fl
        ON unit.floor = fl.id

    LEFT JOIN users o
        ON p.owner_id = o.id
        where o.id =?
  `;

  mysqlconnection.query(query,[id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json({ error: "Database error" });
    }
  });

});

ComplaintRouter.get('/resolution-rate', (req, res) => {
  const query = `
    SELECT 
      status AS name,
      COUNT(id) AS count
    FROM complaints
    GROUP BY status
  `;

  mysqlconnection.query(query, (error, rows) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Database query failed", error });
    }

    const total = rows.reduce((acc, row) => acc + row.count, 0);

    const colors = {
      'Resolved': '#19B65B',
      'In Progress': '#FFA500',
      'Pending': '#FF0000'
    };

    const formattedData = rows.map(row => ({
      name: row.name,
      value: total > 0 ? Math.round((row.count / total) * 100) : 0,
      color: colors[row.name] || '#8884d8'
    }));

    res.json(formattedData);
  });
});


// 1. INSERT ROUTE
ComplaintRouter.post('/add', (req, res) => {
  const { 
    tenant_id, 
    property_id, 
    unit_id, 
    category, 
    title, 
    description, 
    status, 
    resolution_note, 
    attachment, 
    technician, 
    created_at,
    reviewed_at,
    assigned_at,
    resolved_at,
    rejected_at
  } = req.body;

  const insertQuery = `
    INSERT INTO complaints (
      tenant_id, property_id, unit_id, category, title, description, 
      status, resolution_note, attachment, technician, created_at,
      reviewed_at, assigned_at, resolved_at, rejected_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''));
  `;

  const values = [
    tenant_id, property_id, unit_id, category, title, description,
    status, resolution_note, attachment, technician, created_at,
    reviewed_at || '', assigned_at || '', resolved_at || '', rejected_at || ''
  ];

  mysqlconnection.query(insertQuery, values, (error, rows) => {
    if (!error) {
      res.json({ status: 'inserted' });
    } else {
      console.error('Error inserting complaint:', error);
      res.status(500).json({ error: 'Failed to insert complaint', details: error.message });
    }
  });
});

// 2. UPDATE ROUTE
ComplaintRouter.put('/update/:id', (req, res) => {
  const id = req.params.id;
  const { 
    status, 
    resolution_note, 
    technician, 
    reviewed_at, 
    assigned_at, 
    resolved_at, 
    rejected_at 
  } = req.body;

  // COALESCE + NULLIF updates fields ONLY if non-empty data is sent from Flutter
  const updateQuery = `
    UPDATE complaints 
    SET 
      status = COALESCE(NULLIF(?, ''), status), 
      resolution_note = COALESCE(NULLIF(?, ''), resolution_note), 
      technician = COALESCE(NULLIF(?, ''), technician),
      reviewed_at = COALESCE(NULLIF(?, ''), reviewed_at),
      assigned_at = COALESCE(NULLIF(?, ''), assigned_at),
      resolved_at = COALESCE(NULLIF(?, ''), resolved_at),
      rejected_at = COALESCE(NULLIF(?, ''), rejected_at)
    WHERE id = ?;
  `;

  const values = [
    status || '', 
    resolution_note || '', 
    technician || '', 
    reviewed_at || '', 
    assigned_at || '', 
    resolved_at || '', 
    rejected_at || '', 
    id
  ];

  mysqlconnection.query(updateQuery, values, (error, result) => {
    if (error) {
      console.error('Error updating complaint:', error);
      return res.status(500).json({
        error: 'Failed to update complaint',
        details: error.message,
        body: req.body
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.status(200).json({
      message: 'Complaint updated successfully',
      id: id,
      updated_fields: req.body
    });
  });
});

ComplaintRouter.post('/delete:id', (req, res) => {
  const id = req.params.id;
  mysqlconnection.query('delete from complaints where id=?'
    , [id], (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        res.json({ status: error });
      }
    });
});

ComplaintRouter.post('/delete_all/:id', (req, res) => {
  const id = req.params.id;
  mysqlconnection.query('delete from complaints where tenant_id =?'
    , [id], (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        res.json({ status: error });
      }
    });
});

module.exports = ComplaintRouter;