const { Router } = require('express');
const mysqlconnection = require('../dstsbase/database.js');

const PropertyVideosRouter = Router();


// =====================================================
// COMMON PROPERTY VIDEO SELECT
// =====================================================
// IMPORTANT:
// Every endpoint can receive the logged-in user ID through:
//
// ?userId=123
//
// Example:
// /api/property_video/all?userId=123
// /api/property_video/owner/5?userId=123
//
// This allows favourite_id and favourite_user_id to belong
// ONLY to the currently logged-in user.
// =====================================================

const videoSelect = `
    SELECT 
        -- =============================================
        -- VIDEO
        -- =============================================
        pv.id AS id,
        COALESCE(pv.unit_id, 0) AS video_unit_id,
        pv.title AS title,
        pv.description AS video_description,
        pv.video_url AS videoUrl,
        pv.cover_image AS coverImage,
        pv.views_count AS viewsCount,
        pv.created_at AS videoCreatedAt,
        pv.updated_at AS videoUpdatedAt,

        -- =============================================
        -- PROPERTY
        -- =============================================
        p.id AS property_id,
        p.owner_id AS owner_id,
        p.name AS property_name,

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

        p.property_type AS property_type,
        p.floor_number AS floor_number,
        p.pr_code AS pr_code,
        p.rooms AS rooms,
        p.isMasterRoom AS isMasterRoom,

        -- =============================================
        -- UNIT / FLOOR
        -- =============================================
        unit.id AS unit_id,
        unit.unit_code AS unit_code,

        fl.id AS floor_id,
        fl.floor_num AS floor_num,

        -- =============================================
        -- BEDROOM
        -- =============================================
        CASE
            WHEN p.property_type = 'apartment'
            THEN COALESCE(unit.bedroom, p.bedroom)
            ELSE p.bedroom
        END AS bedroom,

        -- =============================================
        -- LIVING ROOMS
        -- =============================================
        CASE
            WHEN p.property_type = 'apartment'
            THEN COALESCE(unit.living_rooms, p.living_rooms)
            ELSE p.living_rooms
        END AS living_rooms,

        -- =============================================
        -- BATHROOMS
        -- =============================================
        CASE
            WHEN p.property_type = 'apartment'
            THEN COALESCE(unit.bathroom, p.bathrooms)
            ELSE p.bathrooms
        END AS bathrooms,

        -- =============================================
        -- KITCHENS
        -- =============================================
        CASE
            WHEN p.property_type = 'apartment'
            THEN COALESCE(unit.kitchens, p.kitchens)
            ELSE p.kitchens
        END AS kitchens,

        -- =============================================
        -- SIZE
        -- =============================================
        CASE
            WHEN p.property_type = 'apartment'
            THEN COALESCE(unit.size, p.size)
            ELSE p.size
        END AS size,

        -- =============================================
        -- RENT
        -- =============================================
        CASE
            WHEN p.property_type = 'apartment'
            THEN COALESCE(unit.rent, p.rent)
            ELSE p.rent
        END AS rent,

        -- =============================================
        -- DEPOSIT
        -- =============================================
        CASE
            WHEN p.property_type = 'apartment'
            THEN COALESCE(unit.deposit, p.deposit)
            ELSE p.deposit
        END AS deposit,

        -- =============================================
        -- PARKING
        -- =============================================
        p.parking_available AS parking_available,

        -- =============================================
        -- PROPERTY DESCRIPTION
        -- =============================================
        p.description AS property_description,

        -- =============================================
        -- LOCATION IDS
        -- =============================================
        p.region_id AS region_id,
        p.district_id AS district_id,
        p.village_id AS village_id,

        -- =============================================
        -- LOCATION NAMES
        -- =============================================
        r.name AS region_name,
        d.name AS district_name,
        v.name AS village_name,

        -- =============================================
        -- ADDRESS
        -- =============================================
        p.address AS address,

        -- =============================================
        -- STATUS
        -- Apartment = unit status
        -- Other property = property status
        -- =============================================
        CASE
            WHEN p.property_type = 'apartment'
            THEN unit.status
            ELSE p.status
        END AS status,

        -- =============================================
        -- RECOMMENDED
        -- =============================================
        p.recommended AS recommended,

        -- =============================================
        -- PROPERTY CREATED DATE
        -- =============================================
        p.created_at AS created_at,

        -- =============================================
        -- OWNER
        -- =============================================
        owner.full_name AS owner_name,
        owner.phone AS owner_phone,

        -- =============================================
        -- FAVOURITE
        -- Only the CURRENT USER's favourite
        -- =============================================
        COALESCE(fav.id, 0) AS favourite_id,
        COALESCE(fav.user_id, 0) AS favourite_user_id

    FROM property_videos pv

    INNER JOIN properties p
        ON pv.property_id = p.id

    INNER JOIN users owner
        ON owner.id = p.owner_id

    INNER JOIN regions r
        ON r.id = p.region_id

    INNER JOIN districts d
        ON d.id = p.district_id

    LEFT JOIN villages v
        ON v.id = p.village_id

    LEFT JOIN unit unit
        ON pv.unit_id = unit.id

    LEFT JOIN floor fl
        ON unit.floor = fl.id

    -- =============================================
    -- CURRENT USER FAVOURITE
    -- =============================================
    LEFT JOIN favourite fav
        ON fav.property_id = p.id
        AND fav.user_id = ?
        AND (
            (
                p.property_type = 'apartment'
                AND fav.unit_id = unit.id
            )
            OR
            (
                p.property_type <> 'apartment'
                AND (
                    fav.unit_id IS NULL
                    OR fav.unit_id = 0
                )
            )
        )
`;


// =====================================================
// GET ALL PROPERTY VIDEOS
// =====================================================
//
// GET /all?userId=123
//
// =====================================================
PropertyVideosRouter.get('/all', (req, res) => {

    const userId = Number(req.query.userId) || 0;

    const query = `
        ${videoSelect}

        ORDER BY pv.created_at DESC
    `;

    mysqlconnection.query(
        query,
        [userId],
        (error, rows) => {

            if (error) {
                console.error(
                    'Error fetching property videos:',
                    error
                );

                return res.status(500).json({
                    error: 'Failed to fetch property videos',
                    details: error.message
                });
            }

            res.json(rows);
        }
    );
});


// =====================================================
// GET VIDEOS BY PROPERTY
// =====================================================
//
// GET /property/:property_id?userId=123
//
// =====================================================
PropertyVideosRouter.get('/property/:property_id', (req, res) => {

    const { property_id } = req.params;
    const userId = Number(req.query.userId) || 0;

    const query = `
        ${videoSelect}

        WHERE pv.property_id = ?

        ORDER BY pv.created_at DESC
    `;

    mysqlconnection.query(
        query,
        [userId, property_id],
        (error, rows) => {

            if (error) {
                console.error(
                    'Error fetching property videos:',
                    error
                );

                return res.status(500).json({
                    error: 'Failed to fetch property videos',
                    details: error.message
                });
            }

            res.json(rows);
        }
    );
});


// =====================================================
// GET VIDEOS BY OWNER
// =====================================================
//
// GET /owner/:owner_id?userId=123
//
// owner_id = property owner
// userId   = logged-in user
//
// They are intentionally separate.
// =====================================================
PropertyVideosRouter.get('/owner/:owner_id', (req, res) => {

    const { owner_id } = req.params;
    const userId = Number(req.query.userId) || 0;

    const query = `
        ${videoSelect}

        WHERE p.owner_id = ?

        ORDER BY pv.created_at DESC
    `;

    mysqlconnection.query(
        query,
        [userId, owner_id],
        (error, rows) => {

            if (error) {
                console.error(
                    'Error fetching owner videos:',
                    error
                );

                return res.status(500).json({
                    error: 'Failed to fetch owner videos',
                    details: error.message
                });
            }

            res.json(rows);
        }
    );
});


// =====================================================
// GET SINGLE VIDEO
// =====================================================
//
// GET /:id?userId=123
//
// =====================================================
PropertyVideosRouter.get('/:id', (req, res) => {

    const { id } = req.params;
    const userId = Number(req.query.userId) || 0;

    const query = `
        ${videoSelect}

        WHERE pv.id = ?

        LIMIT 1
    `;

    mysqlconnection.query(
        query,
        [userId, id],
        (error, rows) => {

            if (error) {
                console.error(
                    'Error fetching video:',
                    error
                );

                return res.status(500).json({
                    error: 'Failed to fetch video',
                    details: error.message
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    error: 'Video not found'
                });
            }

            res.json(rows[0]);
        }
    );
});


// =====================================================
// ADD VIDEO
// =====================================================
PropertyVideosRouter.post('/add', (req, res) => {

    const {
        propertyId,
        unitId,
        title,
        description,
        videoUrl,
        coverImage
    } = req.body;

    if (!propertyId || !title || !videoUrl) {
        return res.status(400).json({
            error: 'propertyId, title and videoUrl are required'
        });
    }

    const query = `
        INSERT INTO property_videos
        (
            property_id,
            unit_id,
            title,
            description,
            video_url,
            cover_image,
            views_count,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
    `;

    mysqlconnection.query(
        query,
        [
            propertyId,
            unitId || 0,
            title,
            description || null,
            videoUrl,
            coverImage || null
        ],
        (error, result) => {

            if (error) {
                console.error(
                    'Error adding property video:',
                    error
                );

                return res.status(500).json({
                    error: 'Failed to add property video',
                    details: error.message
                });
            }

            res.status(201).json({
                success: true,
                message: 'Property video added successfully',
                id: result.insertId
            });
        }
    );
});


// =====================================================
// UPDATE VIDEO
// =====================================================
PropertyVideosRouter.put('/:id', (req, res) => {

    const { id } = req.params;

    const {
        propertyId,
        unitId,
        title,
        description,
        videoUrl,
        coverImage
    } = req.body;

    if (!propertyId || !title || !videoUrl) {
        return res.status(400).json({
            error: 'propertyId, title and videoUrl are required'
        });
    }

    const query = `
        UPDATE property_videos
        SET
            property_id = ?,
            unit_id = ?,
            title = ?,
            description = ?,
            video_url = ?,
            cover_image = ?,
            updated_at = NOW()
        WHERE id = ?
    `;

    mysqlconnection.query(
        query,
        [
            propertyId,
            unitId || 0,
            title,
            description || null,
            videoUrl,
            coverImage || null,
            id
        ],
        (error, result) => {

            if (error) {
                console.error(
                    'Error updating property video:',
                    error
                );

                return res.status(500).json({
                    error: 'Failed to update property video',
                    details: error.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Video not found'
                });
            }

            res.json({
                success: true,
                message: 'Property video updated successfully'
            });
        }
    );
});


// =====================================================
// DELETE VIDEO
// =====================================================
PropertyVideosRouter.delete('/:id', (req, res) => {

    const { id } = req.params;

    const query = `
        DELETE FROM property_videos
        WHERE id = ?
    `;

    mysqlconnection.query(
        query,
        [id],
        (error, result) => {

            if (error) {
                console.error(
                    'Error deleting property video:',
                    error
                );

                return res.status(500).json({
                    error: 'Failed to delete property video',
                    details: error.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Video not found'
                });
            }

            res.json({
                success: true,
                message: 'Property video deleted successfully'
            });
        }
    );
});


// =====================================================
// INCREMENT VIDEO VIEWS
// =====================================================
PropertyVideosRouter.put('/:id/views', (req, res) => {

    const { id } = req.params;

    const query = `
        UPDATE property_videos
        SET views_count = COALESCE(views_count, 0) + 1
        WHERE id = ?
    `;

    mysqlconnection.query(
        query,
        [id],
        (error, result) => {

            if (error) {
                console.error(
                    'Error updating video views:',
                    error
                );

                return res.status(500).json({
                    error: 'Failed to update views',
                    details: error.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Video not found'
                });
            }

            res.json({
                success: true,
                message: 'Video view count updated'
            });
        }
    );
});


module.exports = PropertyVideosRouter;