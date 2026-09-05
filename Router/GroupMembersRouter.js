const { Router } = require('express')
const path = require('path');
const multer = require('multer');

const GroupMembersRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

GroupMembersRouter.get('/', (req, res) => {
    res.status(200).json('server on port 8000 and database is connected');
});

GroupMembersRouter.get('/mygroup/:sender_id', (req, res) => {
  const { sender_id } = req.params;

  mysqlconnection.query(
    `SELECT
            cg.id,
            cg.name,
            cg.created_by,
            u.full_name AS created_by_name,
            u.phone AS created_by_phone,
            cg.created_at
        FROM chat_groups cg

        INNER JOIN group_members gm
            ON cg.id = gm.group_id

        LEFT JOIN users u
            ON cg.created_by = u.id

        WHERE gm.user_id = ?;`,
    [sender_id],
    (error, rows) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

      res.json(rows);
    }
  );
});

GroupMembersRouter.get('/members/:name', (req, res) => {
  const { name } = req.params;

  mysqlconnection.query(
    `SELECT
        cg.id AS group_id,
        cg.name AS group_name,
        cg.created_by,
        cg.created_at,
        gm.id AS member_id,
        gm.user_id,
        gm.joined_at,
        u.full_name,
        u.phone,
        u.role
    FROM chat_groups cg
    LEFT JOIN group_members gm
        ON cg.id = gm.group_id
    LEFT JOIN users u
        ON gm.user_id = u.id where cg.name=?
    ORDER BY cg.id DESC;`,
    [name],
    (error, rows) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

      res.json(rows);
    }
  );
});

GroupMembersRouter.get("/image/:id", (req, res) => {
    const imageId = req.params.id;
    const query = "SELECT image FROM chat_groups  WHERE id=?";

    mysqlconnection.query(query, [imageId], (err, result) => {
        if (err) {
            return res.status(500).send("Error fetching image");
        }
        if (result.length === 0) {
            return res.status(404).send("Image not found");
        }

        res.contentType("image/jpeg");
        res.send(result[0].image); // Send the image buffer back as a response
    });
});

GroupMembersRouter.get("/image_name/:id", (req, res) => {
    const imageId = req.params.id;
    const query = "SELECT image FROM chat_groups  WHERE name=?";

    mysqlconnection.query(query, [imageId], (err, result) => {
        if (err) {
            return res.status(500).send("Error fetching image");
        }
        if (result.length === 0) {
            return res.status(404).send("Image not found");
        }

        res.contentType("image/jpeg");
        res.send(result[0].image); // Send the image buffer back as a response
    });
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

GroupMembersRouter.post("/add", upload.single("image"), (req, res) => {
    const { name, created_by, created_at } = req.body;
    const imageBuffer = req.file.buffer;

    mysqlconnection.query(
        `INSERT INTO chat_groups
        (name,image,created_by,created_at)
        VALUES (?,?,?,?)`,
        [name, imageBuffer, created_by, created_at],
        (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                success: true,
                group_id: result.insertId
            });
        }
    );
});

// GroupMembersRouter.post("/add", upload.single("image"), (req, res) => {
//     const { name, created_by, created_at } = req.body;
//     const imageBuffer = req.file.buffer;
//     const query = "INSERT INTO chat_groups (name,created_by,image ,created_at) VALUES (?,?,?,?)";

//     mysqlconnection.query(query, [name, created_by, imageBuffer, created_at], (err, result) => {
//         if (err) {
//             return res.status(500).json({
//                 message: "Error saving image to database",
//                 error: err
//             });
//         }
//         res.status(200).send("Image uploaded successfully");
//     });
// });

GroupMembersRouter.post('/addMembers', (req, res) => {
    const { group_id , user_id, joined_at  } = req.body;
    console.log(req.body);

    mysqlconnection.query(
        'INSERT INTO group_members (group_id  , user_id,joined_at ) VALUES (?, ?,?);',
        [group_id , user_id, joined_at ],
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

GroupMembersRouter.put("/update/:id", upload.single("image"), (req, res) => {
    const id = req.params.id;
    const {   name } = req.body;

    const imageBuffer = req.file?.buffer;

    // Build dynamic SQL
    let query = `
    UPDATE chat_groups 
    SET name=?
  `;
    const values = [ name];

    // Only update image if a new one is uploaded
    if (imageBuffer) {
        query += `, image = ?`;
        values.push(imageBuffer);
    }

    query += ` WHERE id = ?`;
    values.push(id);

    mysqlconnection.query(query, values, (err, result) => {
        if (err) {
            console.error("? UPDATE ERROR:", err);
            console.error("?? VALUES:", values);

            return res.status(500).json({
                message: "Error updating chat_groups ",
                error: err.message,
                sql: err.sql,
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("chat_groups  not found");
        }

        res.status(200).send("chat_groups  updated successfully");
    });
});

GroupMembersRouter.post('/deleteMember', (req, res) => {
    const { id } = req.body;
    console.log(req.body);
    mysqlconnection.query('delete from group_members where id=?'
        , [id], (error, rows, fields) => {
            if (!error) {
                res.json(rows);
            } else {
                res.json({ status: error });
            }
        });
});

module.exports = GroupMembersRouter;