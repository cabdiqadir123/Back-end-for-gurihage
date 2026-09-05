const express = require("express");
const Router = express.Router();
const mysqlconnection = require("../dstsbase/database");

// Get all technicians
Router.get("/all", (req, res) => {
  mysqlconnection.query(
    "SELECT * FROM technician ORDER BY created_at DESC",
    (err, rows) => {
      if (err) return res.status(500).json(err);

      res.json(rows);
    }
  );
});

// Get technician by id
Router.get("/:id", (req, res) => {
  mysqlconnection.query(
    "SELECT * FROM technician WHERE id=?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      res.json(rows[0] || null);
    }
  );
});

// Add technician
Router.post("/add", (req, res) => {
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
Router.put("/update/:id", (req, res) => {
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
Router.delete("/delete/:id", (req, res) => {
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

module.exports = Router;