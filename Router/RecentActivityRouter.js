const { Router } = require('express');

const RecentActivityRouter = Router();
const mysqlconnection = require('../dstsbase/database.js');

// ? Test route
RecentActivityRouter.get('/', (req, res) => {
    res.status(200).json('Receipt service is running and database is connected');
});

// ? Get all recent_activity
RecentActivityRouter.get('/all', (req, res) => {
    mysqlconnection.query(
        'SELECT * FROM recent_activity',
        (error, rows, fields) => {
            if (!error) {
                res.json(rows);
            } else {
                console.log(error);
                res.status(500).json({ error });
            }
        }
    );
});

// ? Get receipt by user id
RecentActivityRouter.get('/by-user/:user_id', (req, res) => {
    const { user_id } = req.params;

    mysqlconnection.query(
        'SELECT * FROM recent_activity WHERE user_id = ?',
        [user_id],
        (error, rows) => {
            if (!error) {
                res.json(rows);
            } else {
                console.log(error);
                res.status(500).json({ error });
            }
        }
    );
});

// ? Add new receipt
RecentActivityRouter.post('/add', (req, res) => {
    const {
        user_id,
        type,
        subject,
        comment,
        created_at,
    } = req.body;

    mysqlconnection.query(
        `INSERT INTO recent_activity 
        (user_id, type, subject, comment,created_at) 
        VALUES (?, ?, ?, ?, ?)`,
        [user_id, type, subject, comment,created_at],
        (error, rows) => {
            if (!error) {
                res.json({ status: 'inserted', receipt_id: rows.insertId });
            } else {
                console.log(error);
                res.status(500).json({ error });
            }
        }
    );
});

// ? Update receipt
RecentActivityRouter.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const {
        user_id,
        type,
        subject,
        comment,
    } = req.body;

    mysqlconnection.query(
        `UPDATE recent_activity 
         SET user_id=?, type=?, subject=?, comment=? 
         WHERE id=?`,
        [user_id, type, subject, comment, id],
        (error) => {
            if (!error) {
                res.json({ status: 'updated' });
            } else {
                console.log(error);
                res.status(500).json({ error });
            }
        }
    );
});

// ? Delete receipt
RecentActivityRouter.post('/delete', (req, res) => {
    const { id } = req.body;

    mysqlconnection.query(
        'DELETE FROM recent_activity WHERE id=?',
        [id],
        (error, rows) => {
            if (!error) {
                res.json({ status: 'deleted' });
            } else {
                console.log(error);
                res.status(500).json({ error });
            }
        }
    );
});

module.exports = RecentActivityRouter;