const { Router } = require("express");
const multer = require("multer");

const UnitImagesRouter = Router();
const mysqlconnection = require("../dstsbase/database.js");

const storage = multer.memoryStorage();
const upload = multer({ storage });

UnitImagesRouter.get("/", (req, res) => {
    res.status(200).json("Unit Images API");
});

// Get all unit images
UnitImagesRouter.get("/all", (req, res) => {
    mysqlconnection.query(
        "SELECT * FROM unit_image",
        (error, rows) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: "Database error" });
            }

            res.json(rows);
        }
    );
});

// Get all images belonging to one unit
UnitImagesRouter.get("/unit/:id", (req, res) => {

    const unitId = req.params.id;

    mysqlconnection.query(
        "SELECT * FROM unit_image WHERE unit_id=?",
        [unitId],
        (error, rows) => {

            if (error) {
                console.log(error);
                return res.status(500).json({ error: "Database error" });
            }

            res.json(rows);

        }
    );

});

// Return image by image id
UnitImagesRouter.get("/image/:id", (req, res) => {

    const imageId = req.params.id;

    mysqlconnection.query(
        "SELECT image FROM unit_image WHERE id=?",
        [imageId],
        (err, result) => {

            if (err) {
                return res.status(500).send("Error fetching image");
            }

            if (result.length == 0) {
                return res.status(404).send("Image not found");
            }

            res.contentType("image/jpeg");
            res.send(result[0].image);

        }
    );

});

// Add image
UnitImagesRouter.post("/add", upload.single("image"), (req, res) => {

    const { unit_id, created_at } = req.body;

    if (!req.file) {
        return res.status(400).json({
            message: "Image is required"
        });
    }

    mysqlconnection.query(
        `INSERT INTO unit_image
        (unit_id,image,created_at)
        VALUES (?,?,?)`,
        [
            unit_id,
            req.file.buffer,
            created_at
        ],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: err.message
                });
            }

            res.json({
                success: true,
                id: result.insertId
            });

        }
    );

});

// Update image
UnitImagesRouter.put("/update/:id", upload.single("image"), (req, res) => {

    const id = req.params.id;

    const { unit_id } = req.body;

    const imageBuffer = req.file?.buffer;

    let query = `
        UPDATE unit_image
        SET unit_id=?
    `;

    const values = [unit_id];

    if (imageBuffer) {
        query += ", image=?";
        values.push(imageBuffer);
    }

    query += " WHERE id=?";
    values.push(id);

    mysqlconnection.query(
        query,
        values,
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: err.message
                });
            }

            if (result.affectedRows == 0) {
                return res.status(404).json({
                    message: "Image not found"
                });
            }

            res.json({
                success: true
            });

        }
    );

});

// Delete image
// Change "/delete" to "/delete/:id" or standard HTTP DELETE:
UnitImagesRouter.delete("/delete/:id", (req, res) => {
    const { id } = req.params; // <--- Extracts ID from URL

    mysqlconnection.query(
        "DELETE FROM unit_image WHERE id=?",
        [id],
        (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: err.message
                });
            }

            res.json({ success: true, id: id });
        }
    );
});

UnitImagesRouter.post("/deleteByUnit/:unit_id", (req, res) => {
  const { unit_id } = req.params;

  mysqlconnection.query(
    "DELETE FROM unit_image WHERE unit_id=?",
    [unit_id],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ status: "error" });
      }

      res.json({ status: "deleted" });
    }
  );
});

module.exports = UnitImagesRouter;