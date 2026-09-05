const { Router } = require('express')

const NotificationRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

NotificationRouter.get('/', (req, res) => {
  res.status(200).json('server on port 9000 and database is connected');
});

NotificationRouter.get('/all', (req, res) => {
  mysqlconnection.query('select * from notifications',
    (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        console.log(error);
      }
    });
});

NotificationRouter.get('/all_dash', (req, res) => {
  mysqlconnection.query('SELECT from_type,from_id,recipient_role ,created_at  ,message_open  ,title, message , MAX(notification_id ) AS latest_id FROM notifications GROUP BY from_type,from_id,recipient_role ,created_at ,message_open  ,title, message ;',
    (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        console.log(error);
      }
    });
});


NotificationRouter.post('/add', (req, res) => {

  const {
    from_type,
    from_id,
    recipient_role,
    user_id,
    title,
    message,
    message_open,
    type,
    istenant,
    created_at
  } = req.body;

  console.log(req.body);

  mysqlconnection.query(

    `INSERT INTO notifications
    (
      from_type,
      from_id,
      recipient_role,
      user_id,
      title,
      message,
      message_open,
      type,
      istenant,
      created_at
    )

    VALUES(?,?,?,?,?,?,?,?,?,?)`,

    [
      from_type,
      from_id,
      recipient_role,
      user_id,
      title,
      message,
      message_open,
      type,
      istenant,
      created_at
    ],

    (error, rows) => {

      if (error) {

        console.log(error);

        return res.status(500).json({

          success:false,

          message:error.message

        });

      }

      return res.json({

        success:true,

        status:"inserted"

      });

    }

  );

});


NotificationRouter.put('/update', (req, res) => {
  const { recipient_role, message, notification_id } = req.body;
  console.log(req.body);
  mysqlconnection.query('update notifications set recipient_role= ?, message= ? where notification_id=?'
    , [recipient_role, message, notification_id], (error, rows, fields) => {
      if (!error) {
        res.json({ status: 'updated' });
      } else {
        console.log(error);
      }
    });
});

NotificationRouter.put('/update-message-open/:id', (req, res) => {
  const id = req.params.id;
  const { message_open } = req.body;
  mysqlconnection.query('update notifications set message_open=? where notification_id=?'
    , [message_open, id], (error, rows, fields) => {
      if (!error) {
        res.json({ status: 'updated' });
      } else {
        console.log(error);
      }
    });
});


NotificationRouter.put('/update-message-openAdmin/:id', (req, res) => {
  const id = req.params.id;
  mysqlconnection.query('update notifications set message_open="read" where from_id=?'
    , [ id], (error, rows, fields) => {
      if (!error) {
        res.json({ status: 'updated' });
      } else {
        console.log(error);
      }
    });
});


NotificationRouter.post('/delete/:id', (req, res) => {
  const id = req.params.id;
  console.log(req.body);
  mysqlconnection.query('delete from notifications where user_id=?'
    , [id], (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        res.json({ status: error });
      }
    });
});

NotificationRouter.post('/deleteNew/:id', (req, res) => {
  const id = req.params.id;
  console.log(req.body);
  mysqlconnection.query('delete from notifications where notification_id=?'
    , [id], (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        res.json({ status: error });
      }
    });
});


NotificationRouter.post('/delete_all/:id', (req, res) => {
  const id = req.params.id;
  mysqlconnection.query(
    'DELETE FROM notifications WHERE user_id = ? OR from_id = ?',
    [id, id],
    (error, rows, fields) => {
      if (!error) {
        res.json({ success: true, affectedRows: rows.affectedRows });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  );
});

module.exports = NotificationRouter;