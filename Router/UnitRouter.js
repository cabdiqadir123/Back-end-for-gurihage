const { Router } = require('express');
const UnitRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

UnitRouter.get('/', (req, res) => {
    res.json('Unit API Running');
});

UnitRouter.get('/all', (req, res) => {
    mysqlconnection.query(
        `
        SELECT
            u.*,
            p.name AS property_name
        FROM unit u
        LEFT JOIN properties p
        ON u.property_id = p.id
        `,
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


UnitRouter.post('/add', (req, res) => {
    const {
        unit_code,
        floor,
        property_id,
        rent,
        deposit,
        bedroom,
        bathroom,
        living_rooms,
        kitchens,
        status
    } = req.body;

    mysqlconnection.query(
        `INSERT INTO unit
        (unit_code, floor, property_id, rent, deposit, bedroom, bathroom, living_rooms, kitchens, status)
        VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
            unit_code,
            floor,
            property_id,
            rent,
            deposit,
            bedroom,
            bathroom,
            living_rooms,
            kitchens,
            status
        ],
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
                id: result.insertId
            });
        }
    );
});


UnitRouter.post('/update/:id', (req, res) => {
    const { id } = req.params;

    const {
        unit_code,
        floor,
        property_id,
        rent,
        deposit,
        bedroom,
        bathroom,
        living_rooms,
        kitchens,
        status
    } = req.body;

    mysqlconnection.query(
        `
        UPDATE unit
        SET
            unit_code = COALESCE(?, unit_code),
            floor = COALESCE(?, floor),
            property_id = COALESCE(?, property_id),
            rent = COALESCE(?, rent),
            deposit = COALESCE(?, deposit),
            bedroom = COALESCE(?, bedroom),
            bathroom = COALESCE(?, bathroom),
            living_rooms = COALESCE(?, living_rooms),
            kitchens = COALESCE(?, kitchens),
            status = COALESCE(?, status)
        WHERE id = ?
        `,
        [
            unit_code,
            floor,
            property_id,
            rent,
            deposit,
            bedroom,
            bathroom,
            living_rooms,
            kitchens,
            status,
            id
        ],
        (error) => {
            if (!error) {
                return res.json({
                    status: "updated"
                });
            }

            console.log(error);
            return res.status(500).json(error);
        }
    );
});

UnitRouter.post('/status/:id', (req, res) => {

    const { id } = req.params;

    const {
        status
    } = req.body;

    mysqlconnection.query(
        `
        UPDATE unit
        SET
        status=?
        WHERE id=?
        `,
        [
            status,
            id
        ],
        (error) => {
            if (!error) {
                res.json({
                    status: "updated"
                });
            } else {
                console.log(error);
            }
        }
    );

});


UnitRouter.post('/delete/:id', (req, res) => {

    const { id } = req.params;

    mysqlconnection.query(
        'DELETE FROM unit WHERE id=?',
        [id],
        (error) => {
            if (!error) {
                res.json({
                    id: Number(id)
                });
            } else {
                console.log(error);
            }
        }
    );

});

module.exports = UnitRouter;