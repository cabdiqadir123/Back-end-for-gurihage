const { Router } = require('express');
const path = require('path');
const multer = require('multer');

const PropertyRouter = Router();
const mysqlconnection = require('../dstsbase/database.js');

PropertyRouter.get('/', (req, res) => {
    res.status(200).json('server on port 8000 and database is connected');
});

// GET ALL PROPERTIES
PropertyRouter.get("/all", (req, res) => {
    const query = `
        SELECT
            p.id AS property_id,
            p.owner_id,
            unit.id AS unit_id,
            CASE
                WHEN p.property_type = 'apartment'
                THEN CONCAT(
                    p.name,
                    ' - Floor ',
                    fl.floor_num,
                    ' - Unit ',
                    unit.unit_code
                )
                ELSE p.name
            END AS display_name,
            p.property_type,
            p.floor_number,
            p.pr_code,
            p.rooms,
            p.isMasterRoom,
            CASE
                WHEN p.property_type = 'apartment'
                THEN unit.bedroom
                ELSE p.bedroom
            END AS bedroom,
            CASE
                WHEN p.property_type = 'apartment'
                THEN unit.living_rooms
                ELSE p.living_rooms
            END AS living_rooms,
            CASE
                WHEN p.property_type = 'apartment'
                THEN unit.bathroom
                ELSE p.bathrooms
            END AS bathrooms,
            CASE
                WHEN p.property_type = 'apartment'
                THEN unit.kitchens
                ELSE p.kitchens
            END AS kitchens,
            p.size,
            p.parking_available,
            p.description,
            COALESCE(unit.rent, p.rent) AS rent,
            COALESCE(unit.deposit, p.deposit) AS deposit,
            p.region_id,
            r.name AS region_name,
            p.district_id,
            d.name AS district_name,
            p.village_id,
            v.name AS village_name,
            p.address,
            CASE
                WHEN p.property_type = 'apartment'
                THEN unit.status
                ELSE p.status
            END AS status,
            p.recommended,
            p.created_at,
            owner.full_name AS owner_name,
            owner.phone AS owner_phone,
            COALESCE(MAX(fav.id), 0) AS favourite_id,
            COALESCE(MAX(fav.user_id), 0) AS favourite_user_id
        FROM properties p
        JOIN users owner ON owner.id = p.owner_id
        JOIN regions r ON r.id = p.region_id
        JOIN districts d ON d.id = p.district_id
        LEFT JOIN villages v ON v.id = p.village_id
        LEFT JOIN floor fl ON fl.property_id = p.id
        LEFT JOIN unit unit ON unit.floor = fl.id
        -- ? Updated Favourite Join for unit-specific vs property-wide favorites
        LEFT JOIN favourite fav ON fav.property_id = p.id 
            AND (
                (p.property_type = 'apartment' AND fav.unit_id = unit.id)
                OR 
                (p.property_type <> 'apartment' AND (fav.unit_id IS NULL OR fav.unit_id = 0))
            )
        WHERE
        (
            p.property_type = 'apartment'
            AND unit.status = 'vacant'
        )
        OR
        (
            p.property_type <> 'apartment'
        )
        GROUP BY
            p.id,
            p.owner_id,
            unit.id,
            p.property_type,
            p.name,
            fl.floor_num,
            unit.unit_code,
            p.floor_number,
            p.pr_code,
            p.rooms,
            p.isMasterRoom,
            p.bedroom,
            p.living_rooms,
            p.bathrooms,
            p.kitchens,
            p.size,
            p.parking_available,
            p.description,
            unit.rent,
            p.rent,
            unit.deposit,
            p.deposit,
            p.region_id,
            r.name,
            p.district_id,
            d.name,
            p.village_id,
            v.name,
            p.address,
            unit.status,
            p.status,
            p.recommended,
            p.created_at,
            owner.full_name,
            owner.phone
        ORDER BY
            p.name,
            fl.floor_num,
            unit.unit_code;
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

// GET SINGLE PROPERTY BY ID
PropertyRouter.get("/all/:id", (req, res) => {
    const propertiesid = req.params.id;

    const query = `
        SELECT
            p.id AS property_id,
            p.owner_id,
            unit.id AS unit_id,
            CASE
                WHEN p.property_type = 'apartment'
                THEN CONCAT(
                    p.name,
                    ' - Floor ',
                    fl.floor_num,
                    ' - Unit ',
                    unit.unit_code
                )
                ELSE p.name
            END AS display_name,
            p.property_type,
            p.floor_number,
            p.pr_code,
            p.rooms,
            p.isMasterRoom,
            CASE
                WHEN p.property_type = 'apartment'
                THEN unit.bedroom
                ELSE p.bedroom
            END AS bedroom,
            CASE
                WHEN p.property_type = 'apartment'
                THEN unit.living_rooms
                ELSE p.living_rooms
            END AS living_rooms,
            CASE
                WHEN p.property_type = 'apartment'
                THEN unit.bathroom
                ELSE p.bathrooms
            END AS bathrooms,
            CASE
                WHEN p.property_type = 'apartment'
                THEN unit.kitchens
                ELSE p.kitchens
            END AS kitchens,
            p.size,
            p.parking_available,
            p.description,
            COALESCE(unit.rent, p.rent) AS rent,
            COALESCE(unit.deposit, p.deposit) AS deposit,
            p.region_id,
            r.name AS region_name,
            p.district_id,
            d.name AS district_name,
            p.village_id,
            v.name AS village_name,
            p.address,
            CASE
                WHEN p.property_type = 'apartment'
                THEN unit.status
                ELSE p.status
            END AS status,
            p.recommended,
            p.created_at,
            owner.full_name AS owner_name,
            owner.phone AS owner_phone,
            COALESCE(MAX(fav.id), 0) AS favourite_id,
            COALESCE(MAX(fav.user_id), 0) AS favourite_user_id
        FROM properties p
        JOIN users owner ON owner.id = p.owner_id
        JOIN regions r ON r.id = p.region_id
        JOIN districts d ON d.id = p.district_id
        LEFT JOIN villages v ON v.id = p.village_id
        LEFT JOIN floor fl ON fl.property_id = p.id
        LEFT JOIN unit unit ON unit.floor = fl.id
        -- ? Updated Favourite Join here as well
        LEFT JOIN favourite fav ON fav.property_id = p.id 
            AND (
                (p.property_type = 'apartment' AND fav.unit_id = unit.id)
                OR 
                (p.property_type <> 'apartment' AND (fav.unit_id IS NULL OR fav.unit_id = 0))
            )
        WHERE p.id = ? AND (
            (p.property_type = 'apartment' AND unit.status = 'vacant')
            OR
            (p.property_type <> 'apartment')
        )
        GROUP BY
            p.id,
            p.owner_id,
            unit.id,
            p.property_type,
            p.name,
            fl.floor_num,
            unit.unit_code,
            p.floor_number,
            p.pr_code,
            p.rooms,
            p.isMasterRoom,
            p.bedroom,
            p.living_rooms,
            p.bathrooms,
            p.kitchens,
            p.size,
            p.parking_available,
            p.description,
            unit.rent,
            p.rent,
            unit.deposit,
            p.deposit,
            p.region_id,
            r.name,
            p.district_id,
            d.name,
            p.village_id,
            v.name,
            p.address,
            unit.status,
            p.status,
            p.recommended,
            p.created_at,
            owner.full_name,
            owner.phone
        ORDER BY
            p.name,
            fl.floor_num,
            unit.unit_code;
    `;

    mysqlconnection.query(query, [propertiesid], (error, rows) => {
        if (!error) {
            res.json(rows);
        } else {
            console.log(error);
            res.status(500).json({ error: "Database error" });
        }
    });
});

// GET OWNER PROPERTIES// GET OWNER PROPERTIES
// GET OWNER PROPERTIES (Property-level only)
PropertyRouter.get("/ownerall/:id", (req, res) => {
    const propertiesid = req.params.id;
    const query = `
        SELECT 
            p.id AS property_id,
            p.owner_id,
            p.property_type,
            p.name AS display_name,
            p.floor_number,
            p.pr_code,
            p.rooms,
            p.isMasterRoom,
            p.bedroom,
            p.living_rooms,
            p.bathrooms,
            p.kitchens,
            p.size,
            p.parking_available,
            p.description,
            p.rent,
            p.deposit,
            p.region_id,
            r.name AS region_name,
            p.district_id,
            d.name AS district_name,
            p.village_id,
            v.name AS village_name,
            p.address,
            p.status,
            p.recommended,
            p.created_at,
            u.full_name AS owner_name,
            u.phone AS owner_phone,
            COALESCE(MAX(fav.id), 0) AS favourite_id,
            COALESCE(MAX(fav.user_id), 0) AS favourite_user_id
        FROM properties p
        JOIN users u ON p.owner_id = u.id
        JOIN regions r ON p.region_id = r.id
        JOIN districts d ON p.district_id = d.id
        LEFT JOIN villages v ON p.village_id = v.id
        LEFT JOIN favourite fav ON fav.property_id = p.id AND (fav.unit_id IS NULL OR fav.unit_id = 0)
        WHERE p.owner_id = ?
        GROUP BY 
            p.id, p.owner_id, p.property_type, p.name, p.floor_number, p.pr_code, 
            p.rooms, p.isMasterRoom, p.bedroom, p.living_rooms, p.bathrooms, 
            p.kitchens, p.size, p.parking_available, p.description, p.rent, 
            p.deposit, p.region_id, r.name, p.district_id, d.name, p.village_id, 
            v.name, p.address, p.status, p.recommended, p.created_at, u.full_name, u.phone
        ORDER BY p.name;
    `;

    mysqlconnection.query(query, [propertiesid], (error, rows) => {
        if (!error) {
            res.json(rows);
        } else {
            console.log(error);
            res.status(500).json({ error: "Database error" });
        }
    });
});

// GET IMAGE
PropertyRouter.get("/image/:id", (req, res) => {
    const imageId = req.params.id;
    const query = "SELECT image FROM properties WHERE id=?";

    mysqlconnection.query(query, [imageId], (err, result) => {
        if (err) {
            return res.status(500).send("Error fetching image");
        }
        if (result.length === 0) {
            return res.status(404).send("Image not found");
        }

        res.contentType("image/jpeg");
        res.send(result[0].image);
    });
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ADD PROPERTY (Mobile / Lookup names)
PropertyRouter.post("/add", upload.single("image"), (req, res) => {
    const { owner_id, property_type, name, floor_number, pr_code, rooms, isMasterRoom, bedroom, living_rooms, bathrooms, kitchens, size, parking_available, description, rent, deposit, region_id, district_id, village_id, address, status, created_at } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;

    const targetVillage = village_id || 1;

    const query = "INSERT INTO properties (owner_id, property_type, name, floor_number, pr_code, rooms, isMasterRoom, bedroom, living_rooms, bathrooms, kitchens, size, parking_available, description, rent, deposit, region_id, district_id, village_id, address, status, image, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,(SELECT id FROM regions WHERE name=?),(SELECT id FROM districts WHERE name=?),?,?,?,?,?)";

    mysqlconnection.query(query, [owner_id, property_type, name, floor_number, pr_code, rooms, isMasterRoom, bedroom, living_rooms, bathrooms, kitchens, size, parking_available, description, rent, deposit, region_id, district_id, targetVillage, address, status, imageBuffer, created_at], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Error saving property to database",
                error: err
            });
        }

        res.status(200).json({
            message: "property created successfully",
            booking_id: result.insertId
        });
    });
});

// ADD PROPERTY NEW (Dashboard / Direct IDs)
PropertyRouter.post("/addNew", upload.single("image"), (req, res) => {
    const { owner_id, property_type, name, floor_number, pr_code, rooms, isMasterRoom, bedroom, living_rooms, bathrooms, kitchens, size, parking_available, description, rent, deposit, region_id, district_id, village_id, address, status, created_at } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;

    const targetVillage = village_id || 1;

    const query = "INSERT INTO properties (owner_id, property_type, name, floor_number, pr_code, rooms, isMasterRoom, bedroom, living_rooms, bathrooms, kitchens, size, parking_available, description, rent, deposit, region_id, district_id, village_id, address, status, image, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    mysqlconnection.query(query, [owner_id, property_type, name, floor_number, pr_code, rooms, isMasterRoom, bedroom, living_rooms, bathrooms, kitchens, size, parking_available, description, rent, deposit, region_id, district_id, targetVillage, address, status, imageBuffer, created_at], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: err.message,
                sqlError: err
            });
        }
        return res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            propertyId: result.insertId
        });
    });
});

// UPDATE PROPERTY (Mobile / Name Lookup)
PropertyRouter.put("/update/:id", upload.single("image"), (req, res) => {
    const id = req.params.id;
    const { owner_id, property_type, name, floor_number, pr_code, rooms, isMasterRoom, bedroom, living_rooms, bathrooms, kitchens, size, parking_available, description, rent, deposit, region_id, district_id, village_id, address, status } = req.body;

    const imageBuffer = req.file?.buffer;
    const targetVillage = village_id || 1;

    let query = `
    UPDATE properties 
    SET owner_id=?, property_type=?, name=?, floor_number=?, pr_code=?, rooms=?, isMasterRoom=?, bedroom=?, living_rooms=?, bathrooms=?, kitchens=?, size=?, parking_available=?, description=?, rent=?, deposit=?, region_id=(SELECT id FROM regions WHERE name=?), district_id=(SELECT id FROM districts WHERE name=?), village_id=?, address=?, status=?
  `;
    const values = [owner_id, property_type, name, floor_number, pr_code, rooms, isMasterRoom, bedroom, living_rooms, bathrooms, kitchens, size, parking_available, description, rent, deposit, region_id, district_id, targetVillage, address, status];

    if (imageBuffer) {
        query += `, image = ?`;
        values.push(imageBuffer);
    }

    query += ` WHERE id = ?`;
    values.push(id);

    mysqlconnection.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error updating the properties: " + err.message);
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("properties not found");
        }

        res.status(200).send("properties updated successfully");
    });
});

// UPDATE PROPERTY NEW (Dashboard / Direct IDs)
PropertyRouter.put("/updateNew/:id", upload.single("image"), (req, res) => {
    const id = req.params.id;
    const { owner_id, property_type, name, floor_number, pr_code, rooms, isMasterRoom, bedroom, living_rooms, bathrooms, kitchens, size, parking_available, description, rent, deposit, region_id, district_id, village_id, address, status } = req.body;

    const imageBuffer = req.file?.buffer;
    const targetVillage = village_id || 1;

    let query = `
    UPDATE properties 
    SET owner_id=?, property_type=?, name=?, floor_number=?, pr_code=?, rooms=?, isMasterRoom=?, bedroom=?, living_rooms=?, bathrooms=?, kitchens=?, size=?, parking_available=?, description=?, rent=?, deposit=?, region_id=?, district_id=?, village_id=?, address=?, status=?
  `;
    const values = [owner_id, property_type, name, floor_number, pr_code, rooms, isMasterRoom, bedroom, living_rooms, bathrooms, kitchens, size, parking_available, description, rent, deposit, region_id, district_id, targetVillage, address, status];

    if (imageBuffer) {
        query += `, image = ?`;
        values.push(imageBuffer);
    }

    query += ` WHERE id = ?`;
    values.push(id);

    mysqlconnection.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: err.message,
                sqlError: err
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "properties not found" });
        }

        return res.status(200).json({
            success: true,
            message: "properties updated successfully",
            propertyId: id
        });
    });
});

// FLOOR COUNT UPDATES
PropertyRouter.post('/floor/:id', (req, res) => {
    const id = req.params.id;

    mysqlconnection.query(
        `UPDATE properties
     SET floor_number = (
       SELECT COUNT(*)
       FROM floor
       WHERE property_id = ?
     )
     WHERE id = ?`,
        [id, id],
        (error) => {
            if (error) {
                console.log(error);
                return res.status(500).json(error);
            }

            res.json({ status: "updated" });
        }
    );
});

PropertyRouter.post('/floorremove/:id', (req, res) => {
    const id = req.params.id;
    const { floor_number } = req.body;

    mysqlconnection.query(
        `UPDATE properties
    SET floor_number=?
    WHERE id=?`,
        [floor_number, id],
        (error) => {
            if (!error) {
                res.json({ status: 'updated' });
            } else {
                console.log(error);
                res.status(500).json(error);
            }
        }
    );
});

// DELETE PROPERTY
PropertyRouter.post('/delete', (req, res) => {
    const { id } = req.body;
    mysqlconnection.query('DELETE FROM properties WHERE id=?', [id], (error, rows) => {
        if (!error) {
            res.json(rows);
        } else {
            res.status(500).json({ status: error });
        }
    });
});

module.exports = PropertyRouter;