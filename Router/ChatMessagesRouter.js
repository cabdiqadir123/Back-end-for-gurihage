const { Router } = require('express');
const mysqlconnection = require('../dstsbase/database.js');

const ChatMessagesRouter = Router();

// ? Basic test route
ChatMessagesRouter.get('/', (req, res) => {
  res.status(200).json({ message: 'Chat API is running' });
});

// ? Get all chats between two users
ChatMessagesRouter.get('/messages/:sender_id/:receiver_id', (req, res) => {
  const { sender_id, receiver_id } = req.params;

  mysqlconnection.query(
    `SELECT 
      m.*,
      sender.full_name AS sender_name,
      receiver.full_name AS receiver_name
     FROM messages m
     LEFT JOIN users sender ON m.sender_id = sender.id
     LEFT JOIN users receiver ON m.receiver_id = receiver.id
     WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [sender_id, receiver_id, receiver_id, sender_id],
    (error, rows) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }
      res.json(rows);
    }
  );
});

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

ChatMessagesRouter.post('/upload', upload.single('file'), (req, res) => {
  const fileUrl = `https://api.xirfadsame.com/uploads/${req.file.filename}`;
  res.json({ file_url: fileUrl });
});

// ? Send a new message via HTTP POST
ChatMessagesRouter.post('/send', (req, res) => {
  const { chat_id, sender_id, receiver_id, message, type, file_url, duration } = req.body;

  if (!chat_id || !sender_id || !receiver_id) {
    return res.status(400).json({ error: 'Missing required fields (chat_id, sender_id, receiver_id)' });
  }

  const isReceiverOnline = global.onlineUsers ? global.onlineUsers.has(receiver_id) : false;
  const sender_status = 'read';
  const receiver_status = isReceiverOnline ? 'read' : 'unread';

  mysqlconnection.query(
    `INSERT INTO messages 
    (chat_id, sender_id, receiver_id, message, type, file_url, duration, sender_status, receiver_status, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      chat_id,
      sender_id, 
      receiver_id, 
      message || null, 
      type || 'text', 
      file_url || null, 
      duration || null,      
      sender_status,
      receiver_status
    ],
    (error, result) => {
      if (error) {
        console.error("DB Error when sending message:", error);
        return res.status(500).json({ error: 'Failed to send message' });
      }

      res.json({
        success: true,
        message_id: result.insertId,
        chat_id,
        sender_status,
        receiver_status
      });
    }
  );
});

ChatMessagesRouter.put('/status/:id', (req, res) => {
  const id = req.params.id; // receiver_id
  const { status, rent_id } = req.body;

  mysqlconnection.query(
    'UPDATE messages SET receiver_status = ? WHERE receiver_id = ? AND rent_id = ?',
    [status, id, rent_id],
    (error, rows) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
      }

      res.json({
        status: 'updated',
        affectedRows: rows.affectedRows,
      });
    }
  );
});

// ? Optional: Get user’s recent conversations
ChatMessagesRouter.get('/conversations/:user_id', (req, res) => {
  const { user_id } = req.params;

  mysqlconnection.query(
    `SELECT DISTINCT 
        CASE 
            WHEN sender_id = ? THEN receiver_id 
            ELSE sender_id 
        END AS chat_partner
     FROM messages
     WHERE sender_id = ? OR receiver_id = ?`,
    [user_id, user_id, user_id],
    (error, rows) => {
      if (!error) {
        res.json(rows);
      } else {
        console.error(error);
        res.status(500).json({ error: 'Failed to load conversations' });
      }
    }
  );
});

module.exports = ChatMessagesRouter;