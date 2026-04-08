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
      c.category,
      c.title,
      c.description,
      c.status,
      c.resolution_note,
      c.created_at,

      -- Tenant
      t.id AS tenant_id,
      t.full_name AS tenant_name,
      t.phone AS tenant_phone,
      t.address AS tenant_address,

      -- Property
      p.id AS property_id,
      p.name AS property_name,
      p.address AS property_address,

      -- Owner
      o.id AS owner_id,
      o.full_name AS owner_name,
      o.phone AS owner_phone

    FROM complaints c

    LEFT JOIN users t ON c.tenant_id = t.id
    LEFT JOIN properties p ON c.property_id = p.id
    LEFT JOIN users o ON p.owner_id = o.id
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

ComplaintRouter.post('/add', (req, res) => {
  const { tenant_id, property_id, category, title, description, status, resolution_note, created_at } = req.body;
  console.log(req.body);
  mysqlconnection.query('insert into complaints(tenant_id , property_id , category ,title,description, status   ,resolution_note , created_at) values(?,?,?,?,?,?,?,?);',
    [tenant_id, property_id, category, title, description, status, resolution_note, created_at], (error, rows, fields) => {
      if (!error) {
        res.json({ status: 'inserted' });
      } else {
        console.log(error);
      }
    });
});

ComplaintRouter.put('/update/:id', (req, res) => {
  const id = req.params.id;
  const { status, resolution_note } = req.body;

  const query = `
    UPDATE complaints 
    SET status = ?, resolution_note = ? 
    WHERE id = ?;
  `;

  mysqlconnection.query(query, [status, resolution_note, id], (error, result) => {
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
      updated_fields: { issue, comment },
      body: req.body
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