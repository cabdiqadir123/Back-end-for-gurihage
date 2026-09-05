const { Router } = require('express');
const mysqlconnection = require('../dstsbase/database.js');
const multer = require('multer');

const GroupChatRouter = Router();


const upload = multer({ dest: 'uploads/' });
GroupChatRouter.post('/upload', upload.single('file'), (req, res) => {
  const fileUrl = `https://api.gurihage.com/uploads/${req.file.filename}`;
  res.json({ file_url: fileUrl });
});

GroupChatRouter.get('/group-messages/:group_id', (req, res) => {
  const { group_id } = req.params;

  mysqlconnection.query(
    `SELECT
        gm.id,
        gm.group_id,
        gm.sender_id,
        gm.message,
        gm.type,
        gm.file_url,
        gm.duration,
        gm.sender_status,
        gm.receiver_status,
        gm.created_at,
        cg.name AS group_name,
        u.full_name AS sender_name,
        u.phone AS sender_phone
     FROM group_messages gm
     LEFT JOIN chat_groups cg ON gm.group_id = cg.id
     LEFT JOIN users u ON gm.sender_id = u.id
     WHERE gm.group_id = ?
     ORDER BY gm.created_at ASC`,
    [group_id],
    (error, rows) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch group messages' });
      }
      res.json(rows);
    }
  );
});

// HTTP Fallback Post Send
GroupChatRouter.post('/send', (req, res) => {
  const { group_id, sender_id, message, type, file_url, duration } = req.body;

  if (!sender_id || !group_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sender_status = 'read';
  const receiver_status = 'unread';

  mysqlconnection.query(
    `INSERT INTO group_messages  
    (group_id, sender_id, message, type, file_url, duration, sender_status, receiver_status, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [group_id, sender_id, message || null, type || 'text', file_url || null, duration || null, sender_status, receiver_status],
    (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to send message' });
      }

      res.json({
        success: true,
        message_id: result.insertId,
        sender_status,
        receiver_status
      });
    }
  );
});


module.exports = GroupChatRouter;