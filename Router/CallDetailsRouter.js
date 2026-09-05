const { Router } = require("express");

const CallDetailsRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

CallDetailsRouter.get('/', (req, res) => {
  res.status(200).json('server on port 9000 and database is connected');
});

CallDetailsRouter.get('/all/:id', (req, res) => {
    const id = req.params.id;

    const query = `
        SELECT
            c.id,
            c.type,
            c.created_at,

            c.caller_id,
            caller.full_name AS caller_name,
            caller.phone AS caller_phone,

            c.receiver_id,
            receiver.full_name AS receiver_name,
            receiver.phone AS receiver_phone

        FROM calls c

        LEFT JOIN users caller
            ON c.caller_id = caller.id

        LEFT JOIN users receiver
            ON c.receiver_id = receiver.id

        WHERE c.caller_id = ? 
           OR c.receiver_id = ?

        ORDER BY c.created_at DESC
    `;

    mysqlconnection.query(query, [id, id], (error, rows) => {
        if (!error) {
            res.json(rows);
        } else {
            console.log(error);
            res.status(500).json({
                error: "Database error"
            });
        }
    });
});

CallDetailsRouter.post('/add', (req, res) => {
    const { caller_id, receiver_id, type, created_at } = req.body;
    console.log(req.body);

    mysqlconnection.query(
        'INSERT INTO calls(caller_id, receiver_id, type, created_at) VALUES (?, ?,?,?);',
        [caller_id, receiver_id, type, created_at],
        (error, results, fields) => {
            if (!error) {
                // return the inserted ID
                res.json({ status: 'inserted', id: results.insertId });
            } else {
                console.log(error);
                res.status(500).json({ status: 'error', error });
            }
        }
    );
});

module.exports = CallDetailsRouter;