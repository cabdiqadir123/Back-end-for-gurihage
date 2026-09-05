const { Router } = require('express');
const VillageRouter = Router();
const mysqlconnection = require('../dstsbase/database.js');

// Test connection
VillageRouter.get('/', (req, res) => {
    res.status(200).json('Village router active');
});

// Get all villages with district name
VillageRouter.get('/all', (req, res) => {
    const query = `
        SELECT 
            v.id,
            v.name AS village_name,
            v.district_id,
            v.status,
            v.created_at,
            d.name AS district_name
        FROM villages v
        JOIN districts d ON v.district_id = d.id
    `;

    mysqlconnection.query(query, (error, rows) => {
        if (!error) {
            res.json(rows);
        } else {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    });
});

// Get single village by ID
VillageRouter.get('/all/:id', (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT 
            v.id,
            v.name AS village_name,
            v.district_id,
            v.status,
            v.created_at,
            d.name AS district_name
        FROM villages v
        JOIN districts d ON v.district_id = d.id
        WHERE v.id = ?
    `;

    mysqlconnection.query(query, [id], (error, rows) => {
        if (!error) {
            res.json(rows);
        } else {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    });
});

// Add village
VillageRouter.post('/add', (req, res) => {
    const { name, district_id, status, created_at } = req.body;

    const sql = `
        INSERT INTO villages (name, district_id, status, created_at)
        VALUES (?, ?, ?, ?)
    `;

    mysqlconnection.query(
        sql,
        [name, district_id, status, created_at],
        (error, results) => {
            if (error) {
                console.error("? MySQL Insert Error:", error);
                return res.status(500).json({ error: "Database insert failed" });
            }

            const insertedId = results.insertId;

            mysqlconnection.query(
                `SELECT 
                    v.id,
                    v.name AS village_name,
                    v.district_id,
                    v.status,
                    v.created_at,
                    d.name AS district_name
                FROM villages v
                JOIN districts d ON v.district_id = d.id
                WHERE v.id = ?`,
                [insertedId],
                (err2, rows) => {
                    if (err2) {
                        console.error("? MySQL Fetch Error:", err2);
                        return res.status(500).json({ error: "Failed to fetch inserted record" });
                    }

                    res.json(rows[0]);
                }
            );
        }
    );
});

// Update village
VillageRouter.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const { name, district_id, status } = req.body;

    const query = `
        UPDATE villages
        SET 
            name = ?,
            district_id = ?,
            status = ?
        WHERE id = ?;
    `;

    mysqlconnection.query(query, [name, district_id, status, id], (error, result) => {
        if (error) {
            console.error("Error updating village:", error);
            return res.status(500).json({ error: "Failed to update village", details: error });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Village not found" });
        }

        res.status(200).json({
            message: "Village updated successfully",
            id
        });
    });
});

// Delete village
VillageRouter.post('/delete/:id', (req, res) => {
    const id = req.params.id;
    mysqlconnection.query('DELETE FROM villages WHERE id = ?', [id], (error, rows) => {
        if (!error) {
            res.json(rows);
        } else {
            res.json({ status: error });
        }
    });
});

module.exports = VillageRouter;