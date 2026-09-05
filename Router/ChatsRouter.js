const { Router } = require('express');
const ChatRouter = Router();
const mysqlconnection = require('../dstsbase/database.js');

// Base route test
ChatRouter.get('/', (req, res) => {
    res.json('Chat API Running');
});

// Get all chats
ChatRouter.get('/all', (req, res) => {
    mysqlconnection.query(
        `SELECT * FROM chats ORDER BY created_at DESC`,
        (error, rows) => {
            if (!error) {
                res.json(rows);
            } else {
                console.log(error);
                res.status(500).json(error);
            }
        }
    );
});

// Get chats by specific user ID
ChatRouter.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    mysqlconnection.query(
        `SELECT * FROM chats WHERE user_one_id = ? OR user_two_id = ? ORDER BY created_at DESC`,
        [userId, userId],
        (error, rows) => {
            if (!error) {
                res.json(rows);
            } else {
                console.log(error);
                res.status(500).json(error);
            }
        }
    );
});

// Create a new chat session
ChatRouter.post('/add', (req, res) => {
    const { id, user_one_id, user_two_id } = req.body;

    mysqlconnection.query(
        `INSERT INTO chats (id, user_one_id, user_two_id) VALUES (?, ?, ?)`,
        [id, user_one_id, user_two_id],
        (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: error.message
                });
            }

            return res.json({
                success: true,
                id: id
            });
        }
    );
});

// Delete a chat session
ChatRouter.post('/delete/:id', (req, res) => {
    const { id } = req.params;

    mysqlconnection.query(
        'DELETE FROM chats WHERE id = ?',
        [id],
        (error) => {
            if (!error) {
                res.json({ id: id });
            } else {
                console.log(error);
                res.status(500).json(error);
            }
        }
    );
});

module.exports = ChatRouter;