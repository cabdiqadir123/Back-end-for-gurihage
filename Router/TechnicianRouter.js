const express = require("express");
const TechnicianRouter = express.Router();
const mysqlconnection = require("../dstsbase/database");

// Get all technicians
TechnicianRouter.get("/all", (req, res) => {
  mysqlconnection.query(
    "SELECT * FROM technician ORDER BY created_at DESC",
    (err, rows) => {
      if (err) return res.status(500).json(err);

      res.json(rows);
    }
  );
});

// Get technician by id
TechnicianRouter.get("/:id", (req, res) => {
  mysqlconnection.query(
    "SELECT * FROM technician WHERE id=?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      res.json(rows[0] || null);
    }
  );
});

TechnicianRouter.get('/performance', (req, res) => {
  const query = `
    SELECT  
      technician AS name,
      COUNT(id) AS total_assigned,
      SUM(
        CASE 
          WHEN status = 'Resolved' THEN 1 
          ELSE 0 
        END
      ) AS completed
    FROM complaints
    WHERE technician IS NOT NULL 
      AND technician != ''
    GROUP BY technician
  `;

  mysqlconnection.query(query, (error, rows) => {
    if (error) {
      console.error(error);
      return res.status(500).json({
        message: "Database query failed",
        error
      });
    }

    res.json(rows);
  });
});

// Add technician
TechnicianRouter.post("/add", (req, res) => {
  const {
    full_name,
    email,
    phone,
    address,
    job,
    status
  } = req.body;

  mysqlconnection.query(
    `INSERT INTO technician
    (full_name, email, phone, address, job, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      full_name,
      email,
      phone,
      address,
      job,
      status || "Active"
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({
        success: true,
        id: result.insertId
      });
    }
  );
});

// Update technician
TechnicianRouter.put("/update/:id", (req, res) => {
  const {
    full_name,
    email,
    phone,
    address,
    job,
    status
  } = req.body;

  mysqlconnection.query(
    `UPDATE technician
     SET
        full_name=?,
        email=?,
        phone=?,
        address=?,
        job=?,
        status=?
     WHERE id=?`,
    [
      full_name,
      email,
      phone,
      address,
      job,
      status,
      req.params.id
    ],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        success: true
      });
    }
  );
});

// Delete technician
TechnicianRouter.delete("/delete/:id", (req, res) => {
  mysqlconnection.query(
    "DELETE FROM technician WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        success: true
      });
    }
  );
});

module.exports = TechnicianRouter;