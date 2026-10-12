const { Router } = require('express');

const RentedRouter = Router();

const mysqlconnection = require('../dstsbase/database.js');

RentedRouter.get('/', (req, res) => {
  res.status(200).json('server on port 9000 and database is connected');
});

// GET ALL RENTED
RentedRouter.get('/all', (req, res) => {
  const query = `
    SELECT 
      r.id,
      r.unit_id,
      r.move_in_date,
      r.lease,
      r.period,
      r.created_at,
      r.rentStatus,

      t.id AS tenant_id,
      t.full_name AS tenant_name,
      t.email AS tenant_email,
      t.phone AS tenant_phone,

      p.id AS property_id,

      CASE
        WHEN p.property_type = 'apartment'
        THEN CONCAT(
          p.name,
          ' - Floor ',
          f.floor_num,
          ' - Unit ',
          u.unit_code
        )
        ELSE p.name
      END AS property_name,

      p.property_type,
      p.pr_code,
      p.address AS property_address,

      COALESCE(u.rent, p.rent) AS rent,

      p.floor_number,
      p.rooms,
      p.isMasterRoom,

      COALESCE(u.bedroom, p.bedroom) AS bedroom,
      COALESCE(u.living_rooms, p.living_rooms) AS living_rooms,
      COALESCE(u.bathroom, p.bathrooms) AS bathrooms,

      p.size,
      p.parking_available,

      -- Location
      p.region_id,
      reg.name AS region_name,
      p.district_id,
      d.name AS district_name,
      p.village_id,
      v.name AS village_name,

      -- Owner
      o.id AS owner_id,
      o.full_name AS owner_name,
      o.email AS owner_email,
      o.phone AS owner_phone,

      /*
       * Last actual rent payment
       */
      MAX(
        CASE
          WHEN pay.type = 'rent'
           AND pay.status = 'Paid'
          THEN pay.created_at
          ELSE NULL
        END
      ) AS last_payment,


      /*
       * ============================================================
       * NEXT DUE DATE
       * ============================================================
       *
       * Rent is due on the 1st of every month.
       *
       * If this month's rent is unpaid:
       *     current month's 1st
       *
       * If this month's rent is paid:
       *     next month's 1st
       */
      CASE
        WHEN MAX(
          CASE
            WHEN pay.type = 'rent'
             AND pay.status = 'Paid'
             AND pay.rent_month =
                 DATE_FORMAT(CURDATE(), '%Y-%m-01')
            THEN 1
            ELSE 0
          END
        ) = 1

        THEN DATE_FORMAT(
          DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
          '%Y-%m-01'
        )

        ELSE DATE_FORMAT(
          CURDATE(),
          '%Y-%m-01'
        )
      END AS next_due_date,


      /*
       * ============================================================
       * RENT STATUS
       * ============================================================
       *
       * Current month unpaid:
       *
       *   1 - 5  = dueSoon
       *   6+     = overdue
       *
       * Current month paid:
       *
       *   Next month due within 7 days = dueSoon
       *   Otherwise = paid
       */
      CASE

        /*
         * Current month has NOT been paid
         */
        WHEN MAX(
          CASE
            WHEN pay.type = 'rent'
             AND pay.status = 'Paid'
             AND pay.rent_month =
                 DATE_FORMAT(CURDATE(), '%Y-%m-01')
            THEN 1
            ELSE 0
          END
        ) = 0

        THEN
          CASE
            WHEN DAY(CURDATE()) BETWEEN 1 AND 5
            THEN 'dueSoon'

            ELSE 'overdue'
          END


        /*
         * Current month has been paid
         */
        ELSE
          CASE
            WHEN DATEDIFF(
              DATE_FORMAT(
                DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
                '%Y-%m-01'
              ),
              CURDATE()
            ) <= 7

            THEN 'dueSoon'

            ELSE 'paid'
          END

      END AS rent_status,


      /*
       * ============================================================
       * LEASE EXPIRY
       * ============================================================
       */
      CASE

        WHEN LOWER(TRIM(r.lease)) LIKE '%year%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) YEAR
        )

        WHEN LOWER(TRIM(r.lease)) LIKE '%month%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) MONTH
        )

        WHEN LOWER(TRIM(r.lease)) LIKE '%week%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) WEEK
        )

        WHEN LOWER(TRIM(r.lease)) LIKE '%day%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) DAY
        )

        ELSE NULL

      END AS lease_expiry_date,


      /*
       * ============================================================
       * LEASE STATUS
       * ============================================================
       */
      CASE

        WHEN
          CASE
            WHEN LOWER(TRIM(r.lease)) LIKE '%year%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) YEAR
            )

            WHEN LOWER(TRIM(r.lease)) LIKE '%month%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) MONTH
            )

            WHEN LOWER(TRIM(r.lease)) LIKE '%week%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) WEEK
            )

            WHEN LOWER(TRIM(r.lease)) LIKE '%day%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) DAY
            )

            ELSE NULL
          END < CURDATE()

        THEN 'expired'


        WHEN
          DATEDIFF(
            CASE
              WHEN LOWER(TRIM(r.lease)) LIKE '%year%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) YEAR
              )

              WHEN LOWER(TRIM(r.lease)) LIKE '%month%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) MONTH
              )

              WHEN LOWER(TRIM(r.lease)) LIKE '%week%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) WEEK
              )

              WHEN LOWER(TRIM(r.lease)) LIKE '%day%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) DAY
              )

              ELSE NULL
            END,
            CURDATE()
          ) <= 5

        THEN 'expiringSoon'

        ELSE 'active'

      END AS lease_status

    FROM rented r

    LEFT JOIN payment pay
      ON pay.rent_id = r.id

    LEFT JOIN users t
      ON r.tenant_id = t.id

    LEFT JOIN properties p
      ON r.property_id = p.id

    LEFT JOIN regions reg
      ON p.region_id = reg.id

    LEFT JOIN districts d
      ON p.district_id = d.id

    LEFT JOIN villages v
      ON p.village_id = v.id

    LEFT JOIN users o
      ON p.owner_id = o.id

    LEFT JOIN unit u
      ON r.unit_id = u.id

    LEFT JOIN floor f
      ON u.floor = f.id

    GROUP BY r.id;
  `;

  mysqlconnection.query(query, (error, rows) => {
    if (error) {
      console.error("Error fetching all rented records:", error);

      return res.status(500).json({
        error: "Database query failed",
        details: error.message
      });
    }

    res.json(rows);
  });
});

// GET ALL RENTED BY OWNER ID
RentedRouter.get("/allowner/:id", (req, res) => {
  const id = req.params.id;

  const query = `
    SELECT 
      r.id,
      r.unit_id,
      r.move_in_date,
      r.lease,
      r.period,
      r.created_at,
      r.rentStatus,

      t.id AS tenant_id,
      t.full_name AS tenant_name,
      t.email AS tenant_email,
      t.phone AS tenant_phone,

      p.id AS property_id,

      CASE
        WHEN p.property_type = 'apartment'
        THEN CONCAT(
          p.name,
          ' - Floor ',
          f.floor_num,
          ' - Unit ',
          u.unit_code
        )
        ELSE p.name
      END AS property_name,

      p.property_type,
      p.pr_code,
      p.address AS property_address,

      COALESCE(u.rent, p.rent) AS rent,

      p.floor_number,
      p.rooms,
      p.isMasterRoom,

      COALESCE(u.bedroom, p.bedroom) AS bedroom,
      COALESCE(u.living_rooms, p.living_rooms) AS living_rooms,
      COALESCE(u.bathroom, p.bathrooms) AS bathrooms,

      p.size,
      p.parking_available,

      -- Location
      p.region_id,
      reg.name AS region_name,
      p.district_id,
      d.name AS district_name,
      p.village_id,
      v.name AS village_name,

      -- Owner
      o.id AS owner_id,
      o.full_name AS owner_name,
      o.email AS owner_email,
      o.phone AS owner_phone,

      /*
       * Last actual rent payment
       */
      MAX(
        CASE
          WHEN pay.type = 'rent'
           AND pay.status = 'Paid'
          THEN pay.created_at
          ELSE NULL
        END
      ) AS last_payment,


      /*
       * ============================================================
       * NEXT DUE DATE
       * ============================================================
       */
      CASE
        WHEN MAX(
          CASE
            WHEN pay.type = 'rent'
             AND pay.status = 'Paid'
             AND pay.rent_month =
                 DATE_FORMAT(CURDATE(), '%Y-%m-01')
            THEN 1
            ELSE 0
          END
        ) = 1

        THEN DATE_FORMAT(
          DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
          '%Y-%m-01'
        )

        ELSE DATE_FORMAT(
          CURDATE(),
          '%Y-%m-01'
        )
      END AS next_due_date,


      /*
       * ============================================================
       * RENT STATUS
       * ============================================================
       */
      CASE

        /*
         * Current month unpaid
         */
        WHEN MAX(
          CASE
            WHEN pay.type = 'rent'
             AND pay.status = 'Paid'
             AND pay.rent_month =
                 DATE_FORMAT(CURDATE(), '%Y-%m-01')
            THEN 1
            ELSE 0
          END
        ) = 0

        THEN
          CASE
            WHEN DAY(CURDATE()) BETWEEN 1 AND 5
            THEN 'dueSoon'

            ELSE 'overdue'
          END


        /*
         * Current month paid
         */
        ELSE
          CASE
            WHEN DATEDIFF(
              DATE_FORMAT(
                DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
                '%Y-%m-01'
              ),
              CURDATE()
            ) <= 7

            THEN 'dueSoon'

            ELSE 'paid'
          END

      END AS rent_status,


      /*
       * ============================================================
       * LEASE EXPIRY
       * ============================================================
       */
      CASE

        WHEN LOWER(TRIM(r.lease)) LIKE '%year%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) YEAR
        )

        WHEN LOWER(TRIM(r.lease)) LIKE '%month%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) MONTH
        )

        WHEN LOWER(TRIM(r.lease)) LIKE '%week%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) WEEK
        )

        WHEN LOWER(TRIM(r.lease)) LIKE '%day%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) DAY
        )

        ELSE NULL

      END AS lease_expiry_date,


      /*
       * ============================================================
       * LEASE STATUS
       * ============================================================
       */
      CASE

        WHEN
          CASE
            WHEN LOWER(TRIM(r.lease)) LIKE '%year%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) YEAR
            )

            WHEN LOWER(TRIM(r.lease)) LIKE '%month%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) MONTH
            )

            WHEN LOWER(TRIM(r.lease)) LIKE '%week%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) WEEK
            )

            WHEN LOWER(TRIM(r.lease)) LIKE '%day%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) DAY
            )

            ELSE NULL
          END < CURDATE()

        THEN 'expired'


        WHEN
          DATEDIFF(
            CASE
              WHEN LOWER(TRIM(r.lease)) LIKE '%year%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) YEAR
              )

              WHEN LOWER(TRIM(r.lease)) LIKE '%month%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) MONTH
              )

              WHEN LOWER(TRIM(r.lease)) LIKE '%week%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) WEEK
              )

              WHEN LOWER(TRIM(r.lease)) LIKE '%day%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) DAY
              )

              ELSE NULL
            END,
            CURDATE()
          ) <= 5

        THEN 'expiringSoon'

        ELSE 'active'

      END AS lease_status,


      /*
       * Last message
       */
      (
        SELECT message
        FROM messages
        WHERE rent_id = r.id
        ORDER BY created_at DESC
        LIMIT 1
      ) AS last_message,


      /*
       * Unread messages
       */
      (
        SELECT COUNT(*)
        FROM messages
        WHERE rent_id = r.id
          AND receiver_id = ?
          AND receiver_status = 'unread'
      ) AS unread_count


    FROM rented r

    LEFT JOIN payment pay
      ON pay.rent_id = r.id

    LEFT JOIN users t
      ON r.tenant_id = t.id

    LEFT JOIN properties p
      ON r.property_id = p.id

    LEFT JOIN regions reg
      ON p.region_id = reg.id

    LEFT JOIN districts d
      ON p.district_id = d.id

    LEFT JOIN villages v
      ON p.village_id = v.id

    LEFT JOIN users o
      ON p.owner_id = o.id

    LEFT JOIN unit u
      ON r.unit_id = u.id

    LEFT JOIN floor f
      ON u.floor = f.id

    WHERE o.id = ?

    GROUP BY r.id;
  `;

  mysqlconnection.query(query, [id, id], (error, rows) => {
    if (error) {
      console.error("Error fetching owner's rented records:", error);

      return res.status(500).json({
        error: "Database query failed",
        details: error.message
      });
    }

    res.json(rows);
  });
});

// GET ALL RENTED BY TENANT ID
RentedRouter.get("/alltenant/:id", (req, res) => {
  const id = req.params.id;

  const query = `
    SELECT 
      r.id,
      r.unit_id,
      r.move_in_date,
      r.lease,
      r.period,
      r.created_at,
      r.rentStatus,

      t.id AS tenant_id,
      t.full_name AS tenant_name,
      t.email AS tenant_email,
      t.phone AS tenant_phone,

      p.id AS property_id,

      CASE
        WHEN p.property_type = 'apartment'
        THEN CONCAT(
          p.name,
          ' - Floor ',
          f.floor_num,
          ' - Unit ',
          u.unit_code
        )
        ELSE p.name
      END AS property_name,

      p.property_type,
      p.pr_code,
      p.address AS property_address,

      COALESCE(u.rent, p.rent) AS rent,

      p.floor_number,
      p.rooms,
      p.isMasterRoom,

      COALESCE(u.bedroom, p.bedroom) AS bedroom,
      COALESCE(u.living_rooms, p.living_rooms) AS living_rooms,
      COALESCE(u.bathroom, p.bathrooms) AS bathrooms,

      p.size,
      p.parking_available,

      -- Location details
      p.region_id,
      reg.name AS region_name,

      p.district_id,
      d.name AS district_name,

      p.village_id,
      v.name AS village_name,

      -- Owner
      o.id AS owner_id,
      o.full_name AS owner_name,
      o.email AS owner_email,
      o.phone AS owner_phone,

      -- Last actual payment date
      MAX(
        CASE
          WHEN pay.type = 'rent'
           AND pay.status = 'Paid'
          THEN pay.created_at
          ELSE NULL
        END
      ) AS last_payment,

      /*
       * ============================================================
       * NEXT RENT DUE DATE
       * ============================================================
       *
       * Rent is due on the 1st of every month.
       *
       * If the current month's rent is already paid:
       *     next_due_date = 1st of next month
       *
       * If the current month's rent is NOT paid:
       *     next_due_date = 1st of current month
       *
       * Example:
       *
       * Today: September 17
       *
       * September rent unpaid:
       *     next_due_date = September 1
       *     status = overdue
       *
       * September rent paid:
       *     next_due_date = October 1
       */
      CASE
        WHEN MAX(
          CASE
            WHEN pay.type = 'rent'
             AND pay.status = 'Paid'
             AND pay.rent_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
            THEN 1
            ELSE 0
          END
        ) = 1
        THEN DATE_FORMAT(
          DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
          '%Y-%m-01'
        )

        ELSE DATE_FORMAT(
          CURDATE(),
          '%Y-%m-01'
        )
      END AS next_due_date,


      /*
       * ============================================================
       * RENT STATUS
       * ============================================================
       *
       * Rules:
       *
       * 1. Current month's rent is unpaid:
       *
       *    Day 1 - 5  = dueSoon
       *    Day 6+     = overdue
       *
       * 2. Current month's rent is already paid:
       *
       *    Next rent is due on the 1st of next month.
       *
       *    If next due date is within 7 days:
       *        dueSoon
       *
       *    Otherwise:
       *        paid
       *
       * This means a late payment NEVER moves the due date.
       */
      CASE

        /*
         * ------------------------------------------------------------
         * CURRENT MONTH IS UNPAID
         * ------------------------------------------------------------
         */
        WHEN MAX(
          CASE
            WHEN pay.type = 'rent'
             AND pay.status = 'Paid'
             AND pay.rent_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
            THEN 1
            ELSE 0
          END
        ) = 0

        THEN
          CASE

            -- Payment window: 1st through 5th
            WHEN DAY(CURDATE()) BETWEEN 1 AND 5
            THEN 'dueSoon'

            -- After the 5th
            ELSE 'overdue'

          END


        /*
         * ------------------------------------------------------------
         * CURRENT MONTH IS PAID
         * ------------------------------------------------------------
         */
        ELSE
          CASE

            /*
             * Next month's 1st is within 7 days.
             *
             * Example:
             * September 25 -> October 1 = 6 days
             * September 30 -> October 1 = 1 day
             */
            WHEN DATEDIFF(
              DATE_FORMAT(
                DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
                '%Y-%m-01'
              ),
              CURDATE()
            ) <= 7
            THEN 'dueSoon'

            ELSE 'paid'

          END

      END AS rent_status,


      /*
       * ============================================================
       * LEASE EXPIRY
       * ============================================================
       *
       * Your database example:
       *
       * lease  = '1 year'
       * period = 1
       *
       * Therefore:
       * move_in_date + 1 YEAR
       *
       * NOT:
       * move_in_date + 1 MONTH
       */
      CASE
        WHEN LOWER(TRIM(r.lease)) LIKE '%year%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) YEAR
        )

        WHEN LOWER(TRIM(r.lease)) LIKE '%month%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) MONTH
        )

        WHEN LOWER(TRIM(r.lease)) LIKE '%week%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) WEEK
        )

        WHEN LOWER(TRIM(r.lease)) LIKE '%day%'
        THEN DATE_ADD(
          r.move_in_date,
          INTERVAL CAST(r.period AS UNSIGNED) DAY
        )

        ELSE NULL
      END AS lease_expiry_date,


      /*
       * ============================================================
       * LEASE STATUS
       * ============================================================
       */
      CASE

        WHEN
          CASE
            WHEN LOWER(TRIM(r.lease)) LIKE '%year%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) YEAR
            )

            WHEN LOWER(TRIM(r.lease)) LIKE '%month%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) MONTH
            )

            WHEN LOWER(TRIM(r.lease)) LIKE '%week%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) WEEK
            )

            WHEN LOWER(TRIM(r.lease)) LIKE '%day%'
            THEN DATE_ADD(
              r.move_in_date,
              INTERVAL CAST(r.period AS UNSIGNED) DAY
            )

            ELSE NULL
          END < CURDATE()

        THEN 'expired'


        WHEN
          DATEDIFF(
            CASE
              WHEN LOWER(TRIM(r.lease)) LIKE '%year%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) YEAR
              )

              WHEN LOWER(TRIM(r.lease)) LIKE '%month%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) MONTH
              )

              WHEN LOWER(TRIM(r.lease)) LIKE '%week%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) WEEK
              )

              WHEN LOWER(TRIM(r.lease)) LIKE '%day%'
              THEN DATE_ADD(
                r.move_in_date,
                INTERVAL CAST(r.period AS UNSIGNED) DAY
              )

              ELSE NULL
            END,
            CURDATE()
          ) <= 5

        THEN 'expiringSoon'

        ELSE 'active'

      END AS lease_status,


      /*
       * ============================================================
       * CHAT
       * ============================================================
       */
      (
        SELECT message
        FROM messages
        WHERE rent_id = r.id
        ORDER BY created_at DESC
        LIMIT 1
      ) AS last_message,


      (
        SELECT COUNT(*)
        FROM messages
        WHERE rent_id = r.id
          AND receiver_id = ?
          AND receiver_status = 'unread'
      ) AS unread_count


    FROM rented r

    LEFT JOIN payment pay
      ON pay.rent_id = r.id

    LEFT JOIN users t
      ON r.tenant_id = t.id

    LEFT JOIN properties p
      ON r.property_id = p.id

    LEFT JOIN regions reg
      ON p.region_id = reg.id

    LEFT JOIN districts d
      ON p.district_id = d.id

    LEFT JOIN villages v
      ON p.village_id = v.id

    LEFT JOIN users o
      ON p.owner_id = o.id

    LEFT JOIN unit u
      ON r.unit_id = u.id

    LEFT JOIN floor f
      ON u.floor = f.id

    WHERE r.tenant_id = ?

    GROUP BY r.id;
  `;

  mysqlconnection.query(query, [id, id], (error, rows) => {
    if (error) {
      console.error("Error fetching tenant rented records:", error);

      return res.status(500).json({
        error: "Database query failed",
        details: error.message
      });
    }

    res.json(rows);
  });
});

// Express.js snippet for backend route
RentedRouter.get('/rent-status/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // Query database for active rent invoice/lease details for user
    const query = `SELECT amount, due_date, 
                    (DATEDIFF(due_date, NOW()) BETWEEN 0 AND 3) AS is_due_soon,
                    (DATEDIFF(due_date, NOW()) < 0) AS is_overdue 
                   FROM tenant_rentals WHERE tenant_id = ? AND status = 'unpaid' LIMIT 1`;
                   
    const [rows] = await db.query(query, [userId]);
    
    if (rows.length === 0) {
      return res.json({ amount: 0.0, is_due_soon: false, is_overdue: false, formatted_date: '' });
    }

    const row = rows[0];
    const dueDateObj = new Date(row.due_date);
    // Format date similar to design (e.g., "Due Oct 12")
    const formattedDate = `Due ${dueDateObj.toLocaleString('en', { month: 'short' })} ${dueDateObj.getDate()}`;

    res.json({
      amount: row.amount,
      is_due_soon: Boolean(row.is_due_soon),
      is_overdue: Boolean(row.is_overdue),
      formatted_date: formattedDate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

RentedRouter.post('/add', (req, res) => {
  const {
    tenant_id,
    property_id,
    unit_id,
    move_in_date,
    lease,
    period,
    rentStatus,
    created_at
  } = req.body;

  console.log(req.body);

  const query = `
    INSERT INTO rented
    (tenant_id, property_id, unit_id, move_in_date, lease, period, rentStatus, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  mysqlconnection.query(
    query,
    [tenant_id, property_id, unit_id, move_in_date, lease, period, rentStatus, created_at],
    (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: error });
      }

      const insertedId = results.insertId;

      res.status(200).json({
        message: "Rented entry created successfully",
        rented_id: insertedId
      });
    }
  );
});

RentedRouter.post('/addNew', (req, res) => {
  const {
    tenant_id,
    property_id,
    move_in_date,
    lease,
    period,
    rentStatus,
    created_at
  } = req.body;

  console.log(req.body);

  const query = `
    INSERT INTO rented
    (tenant_id, property_id, move_in_date, lease, period, rentStatus, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  mysqlconnection.query(
    query,
    [tenant_id, property_id, move_in_date, lease, period, rentStatus, created_at],
    (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to insert rented entry" });
      }

      const insertedId = results.insertId;

      res.status(200).json({
        message: "Rented entry created successfully",
        booking_id: insertedId
      });
    }
  );
});

RentedRouter.put('/updatestatus/:id', (req, res) => {
  const id = req.params.id;
  const { rentStatus } = req.body;

  if (!rentStatus) {
    return res.status(400).json({ error: "status is required" });
  }

  const query = `
    UPDATE rented
    SET rentStatus = ?
    WHERE id = ?;
  `;

  mysqlconnection.query(query, [rentStatus, id], (error, result) => {
    if (error) {
      console.error("Error updating status:", error);
      return res.status(500).json({ error: "Failed to update status", details: error });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Rented record not found" });
    }

    res.status(200).json({
      message: "Rented status updated successfully",
      id: id,
      new_status: rentStatus
    });
  });
});

RentedRouter.put('/updatelease/:id', (req, res) => {
  const id = req.params.id;
  const { lease } = req.body;
  console.log(req.body);
  mysqlconnection.query('UPDATE rented SET lease=? WHERE id=?'
    , [lease, id], (error, rows, fields) => {
      if (!error) {
        res.json({ status: 'updated' });
      } else {
        console.log(error);
        res.status(500).json({ error: "Update failed" });
      }
    });
});

RentedRouter.post('/delete', (req, res) => {
  const { supplier_id } = req.body;
  console.log(req.body);
  mysqlconnection.query('DELETE FROM rented WHERE id=?'
    , [supplier_id], (error, rows, fields) => {
      if (!error) {
        res.json(rows);
      } else {
        res.status(500).json({ status: error });
      }
    });
});

module.exports = RentedRouter;