const { Router } = require('express');
const mysqlconnection = require('../dstsbase/database.js');

const PropertyVideosRouter = Router();


// =====================================================
// GET ALL PROPERTY VIDEOS
// =====================================================
PropertyVideosRouter.get('/all', (req, res) => {

    const query = `
    SELECT
      pv.id AS id,

      p.owner_id AS ownerId,
      p.id AS propertyId,
      COALESCE(pv.unit_id, 0) AS unitId,

      pv.title AS title,
      pv.description AS description,
      pv.video_url AS videoUrl,

      p.property_type AS propertyType,

      COALESCE(u.rent, p.rent) AS price,

      CASE
        WHEN p.address IS NOT NULL AND p.address != ''
          THEN p.address
        ELSE CONCAT_WS(', ',
          v.name,
          d.name,
          reg.name
        )
      END AS location,

      COALESCE(u.bedroom, p.bedroom) AS bedrooms,

      COALESCE(u.bathroom, p.bathrooms) AS bathrooms,

      COALESCE( p.size) AS area,

      pv.views_count AS viewsCount,

      pv.created_at AS createdAt

    FROM property_videos pv

    LEFT JOIN properties p
      ON pv.property_id = p.id

    LEFT JOIN unit u
      ON pv.unit_id = u.id

    LEFT JOIN regions reg
      ON p.region_id = reg.id

    LEFT JOIN districts d
      ON p.district_id = d.id

    LEFT JOIN villages v
      ON p.village_id = v.id

    LEFT JOIN users o
      ON p.owner_id = o.id

    ORDER BY pv.created_at DESC
  `;

    mysqlconnection.query(query, (error, rows) => {

        if (error) {
            console.error('Error fetching property videos:', error);
            return res.status(500).json({
                error: 'Failed to fetch property videos'
            });
        }

        res.json(rows);
    });
});


// =====================================================
// GET VIDEOS BY PROPERTY
// =====================================================
PropertyVideosRouter.get('/property/:property_id', (req, res) => {

    const { property_id } = req.params;

    const query = `
    SELECT
      pv.id AS id,

      p.owner_id AS ownerId,
      p.id AS propertyId,
      COALESCE(pv.unit_id, 0) AS unitId,

      pv.title AS title,
      pv.description AS description,
      pv.video_url AS videoUrl,

      p.property_type AS propertyType,

      COALESCE(u.rent, p.rent) AS price,

      CASE
        WHEN p.address IS NOT NULL AND p.address != ''
          THEN p.address
        ELSE CONCAT_WS(', ',
          v.name,
          d.name,
          reg.name
        )
      END AS location,

      COALESCE(u.bedroom, p.bedroom) AS bedrooms,

      COALESCE(u.bathroom, p.bathrooms) AS bathrooms,

      COALESCE( p.size) AS area,

      pv.views_count AS viewsCount,

      pv.created_at AS createdAt

    FROM property_videos pv

    LEFT JOIN properties p
      ON pv.property_id = p.id

    LEFT JOIN unit u
      ON pv.unit_id = u.id

    LEFT JOIN regions reg
      ON p.region_id = reg.id

    LEFT JOIN districts d
      ON p.district_id = d.id

    LEFT JOIN villages v
      ON p.village_id = v.id

    WHERE pv.property_id = ?

    ORDER BY pv.created_at DESC
  `;

    mysqlconnection.query(
        query,
        [property_id],
        (error, rows) => {

            if (error) {
                console.error('Error fetching property videos:', error);
                return res.status(500).json({
                    error: 'Failed to fetch property videos'
                });
            }

            res.json(rows);
        }
    );
});


// =====================================================
// GET VIDEOS BY OWNER
// =====================================================
PropertyVideosRouter.get('/owner/:owner_id', (req, res) => {

    const { owner_id } = req.params;

    const query = `
    SELECT
      pv.id AS id,

      p.owner_id AS ownerId,
      p.id AS propertyId,
      COALESCE(pv.unit_id, 0) AS unitId,

      pv.title AS title,
      pv.description AS description,
      pv.video_url AS videoUrl,

      p.property_type AS propertyType,

      COALESCE(u.rent, p.rent) AS price,

      CASE
        WHEN p.address IS NOT NULL AND p.address != ''
          THEN p.address
        ELSE CONCAT_WS(', ',
          v.name,
          d.name,
          reg.name
        )
      END AS location,

      COALESCE(u.bedroom, p.bedroom) AS bedrooms,

      COALESCE(u.bathroom, p.bathrooms) AS bathrooms,

      COALESCE( p.size) AS area,

      pv.views_count AS viewsCount,

      pv.created_at AS createdAt

    FROM property_videos pv

    LEFT JOIN properties p
      ON pv.property_id = p.id

    LEFT JOIN unit u
      ON pv.unit_id = u.id

    LEFT JOIN regions reg
      ON p.region_id = reg.id

    LEFT JOIN districts d
      ON p.district_id = d.id

    LEFT JOIN villages v
      ON p.village_id = v.id

    WHERE p.owner_id = ?

    ORDER BY pv.created_at DESC
  `;

    mysqlconnection.query(
        query,
        [owner_id],
        (error, rows) => {

            if (error) {
                console.error('Error fetching owner videos:', error);
                return res.status(500).json({
                    error: 'Failed to fetch owner videos'
                });
            }

            res.json(rows);
        }
    );
});


// =====================================================
// GET SINGLE VIDEO
// =====================================================
PropertyVideosRouter.get('/:id', (req, res) => {

    const { id } = req.params;

    const query = `
    SELECT
      pv.id AS id,

      p.owner_id AS ownerId,
      p.id AS propertyId,
      COALESCE(pv.unit_id, 0) AS unitId,

      pv.title AS title,
      pv.description AS description,
      pv.video_url AS videoUrl,

      p.property_type AS propertyType,

      COALESCE(u.rent, p.rent) AS price,

      CASE
        WHEN p.address IS NOT NULL AND p.address != ''
          THEN p.address
        ELSE CONCAT_WS(', ',
          v.name,
          d.name,
          reg.name
        )
      END AS location,

      COALESCE(u.bedroom, p.bedroom) AS bedrooms,

      COALESCE(u.bathroom, p.bathrooms) AS bathrooms,

      COALESCE(u.size, p.size) AS area,

      pv.views_count AS viewsCount,

      pv.created_at AS createdAt

    FROM property_videos pv

    LEFT JOIN properties p
      ON pv.property_id = p.id

    LEFT JOIN unit u
      ON pv.unit_id = u.id

    LEFT JOIN regions reg
      ON p.region_id = reg.id

    LEFT JOIN districts d
      ON p.district_id = d.id

    LEFT JOIN villages v
      ON p.village_id = v.id

    WHERE pv.id = ?

    LIMIT 1
  `;

    mysqlconnection.query(
        query,
        [id],
        (error, rows) => {

            if (error) {
                console.error('Error fetching video:', error);
                return res.status(500).json({
                    error: 'Failed to fetch video'
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
                console.error('Error adding property video:', error);

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
                console.error('Error updating property video:', error);

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
                console.error('Error deleting property video:', error);

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
    SET views_count = views_count + 1
    WHERE id = ?
  `;

    mysqlconnection.query(
        query,
        [id],
        (error, result) => {

            if (error) {
                console.error('Error updating video views:', error);

                return res.status(500).json({
                    error: 'Failed to update views'
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