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

    const query = `
      SELECT 
          c.id AS chat_id,
          c.user_one_id,
          c.user_two_id,
          c.created_at,

          -- Other user details (the user current viewer is chatting with)
          u.id AS partner_id,
          u.full_name AS partner_name,
          u.email AS partner_email,
          u.phone AS partner_phone,

          -- 1. Fetch Last Message Text (defaults to 'Chat now' if NULL) & Sent Time
          IFNULL(
              (SELECT message FROM messages 
               WHERE chat_id = c.id 
               ORDER BY created_at DESC LIMIT 1),
              'Chat now'
          ) AS last_message,

          (SELECT created_at FROM messages 
           WHERE chat_id = c.id 
           ORDER BY created_at DESC LIMIT 1) AS last_message_time,

          -- 2. Fetch Unread Count (defaults to 0 if NULL)
          IFNULL(
              (SELECT COUNT(*) FROM messages 
               WHERE chat_id = c.id 
                 AND receiver_id = ? 
                 AND receiver_status = 'unread'),
              0
          ) AS unread_count

      FROM chats c
      LEFT JOIN users u ON u.id = IF(c.user_one_id = ?, c.user_two_id, c.user_one_id)
      WHERE c.user_one_id = ? OR c.user_two_id = ?
      ORDER BY 
          COALESCE(
              (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1), 
              c.created_at
          ) DESC;
    `;

    mysqlconnection.query(
        query,
        [userId, userId, userId, userId],
        (error, rows) => {
            if (!error) {
                res.json(rows);
            } else {
                console.error("DB Error in fetching chats:", error);
                res.status(500).json({ error: "Failed to fetch chat conversations" });
            }
        }
    );
});

// Create a new chat session
ChatRouter.post('/add', (req, res) => {
    const { user_one_id, user_two_id } = req.body;

    if (!user_one_id || !user_two_id) {
        return res.status(400).json({
            success: false,
            message: "Both user_one_id and user_two_id are required"
        });
    }

    // 1. Check if a chat already exists between these two users (in either direction)
    const checkQuery = `
        SELECT id FROM chats 
        WHERE (user_one_id = ? AND user_two_id = ?) 
           OR (user_one_id = ? AND user_two_id = ?)
        LIMIT 1
    `;

    mysqlconnection.query(
        checkQuery,
        [user_one_id, user_two_id, user_two_id, user_one_id],
        (checkError, checkResults) => {
            if (checkError) {
                console.error("Check Chat Error:", checkError);
                return res.status(500).json({
                    success: false,
                    message: checkError.message
                });
            }

            // If chat already exists, return the existing chat ID
            if (checkResults.length > 0) {
                return res.status(200).json({
                    success: true,
                    message: "Chat already exists",
                    id: checkResults[0].id,
                    isExisting: true
                });
            }

            // 2. Insert new chat (omitting auto-incremented id)
            const insertQuery = `INSERT INTO chats (user_one_id, user_two_id) VALUES (?, ?)`;
            mysqlconnection.query(
                insertQuery,
                [user_one_id, user_two_id],
                (insertError, insertResult) => {
                    if (insertError) {
                        console.error("Insert Chat Error:", insertError);
                        return res.status(500).json({
                            success: false,
                            message: insertError.message
                        });
                    }

                    return res.status(201).json({
                        success: true,
                        message: "Chat created successfully",
                        id: insertResult.insertId, // ? Returns the auto-generated ID
                        isExisting: false
                    });
                }
            );
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