const { Router } = require('express')
const path = require('path');
const multer = require('multer');

const PropertyImagesRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

PropertyImagesRouter.get('/', (req, res) => {
    res.status(200).json('server on port 8000 and database is connected');
});

PropertyImagesRouter.get("/all", (req, res) => {

    const query = `
        SELECT * from property_images
    `;

    mysqlconnection.query(query, (error, rows) => {
        if (!error) {
            res.json(rows);
        } else {
            console.log(error);
            res.status(500).json({ error: "Database error" });
        }
    });
});

PropertyImagesRouter.get("/image/:id", (req, res) => {
    const imageId = req.params.id;
    const query = "SELECT image FROM property_images WHERE unit_code=?";

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

PropertyImagesRouter.get("/image_BY/:id", (req, res) => {
    const imageId = req.params.id;
    const query = "SELECT image FROM property_images WHERE id=?";

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

PropertyImagesRouter.post("/add", upload.single("image"), (req, res) => {
    const { pr_code,  created_at } = req.body;
    const imageBuffer = req.file.buffer;
    const query = "INSERT INTO property_images ( pr_code,image ,created_at) VALUES (?,?,?)";

    mysqlconnection.query(query, [pr_code, imageBuffer, created_at], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Error saving image to database",
                error: err
            });
        }
        res.status(200).send("Image uploaded successfully");
    });
});

PropertyImagesRouter.put("/update/:id", upload.single("image"), (req, res) => {
    const id = req.params.id;
    const {   pr_code } = req.body;

    const imageBuffer = req.file?.buffer;

    // Build dynamic SQL
    let query = `
    UPDATE property_images 
    SET pr_code=?
  `;
    const values = [ pr_code];

    // Only update image if a new one is uploaded
    if (imageBuffer) {
        query += `, image = ?`;
        values.push(imageBuffer);
    }

    query += ` WHERE id = ?`;
    values.push(id);

    mysqlconnection.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error updating the property_images");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("property_images not found");
        }

        res.status(200).send("property_images updated successfully");
    });
});


PropertyImagesRouter.post('/delete', (req, res) => {
    const { id } = req.body;
    console.log(req.body);
    mysqlconnection.query('delete from property_images where id=?'
        , [id], (error, rows, fields) => {
            if (!error) {
                res.json(rows);
            } else {
                res.json({ status: error });
            }
        });
});

module.exports = PropertyImagesRouter;