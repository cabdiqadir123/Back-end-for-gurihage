const { Router } = require('express');
const WalletRouter = Router();
const mysqlconnection = require('../dstsbase/database.js');

WalletRouter.get('/', (req, res) => {
  res.status(200).json('server on port 9000 and database is connected');
});

// Get all wallet entries
WalletRouter.get('/all', (req, res) => {
  const query = `SELECT * FROM wallet ORDER BY created_at DESC`;
  mysqlconnection.query(query, (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json(error);
    }
  });
});

// Calculate metrics (Available Balance, Pending, Total Earnings, Total Withdrawn) from wallet & withdrawals tables
WalletRouter.get('/Income/user_id/:id', (req, res) => {
  const { id } = req.params;
  const walletQuery = 'SELECT * FROM wallet WHERE user_id = ? ORDER BY created_at DESC';
  const withdrawalQuery = 'SELECT * FROM withdrawals WHERE owner_id = ? ORDER BY date DESC';

  mysqlconnection.query(walletQuery, [id], (error, walletRows) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ message: "Database error", error });
    }

    mysqlconnection.query(withdrawalQuery, [id], (err2, withdrawalRows) => {
      if (err2) {
        console.log(err2);
        return res.status(500).json({ message: "Database error", error: err2 });
      }

      let available_balance = 0;
      let pending_balance = 0;
      let total_earnings = 0;
      let total_withdrawn = 0;

      // Calculate earnings from wallet table
      walletRows.forEach(item => {
        const amt = Number(item.amount || 0);

        const type = String(item.type || '').toLowerCase();
        const method = String(item.method || '').toLowerCase();
        const status = String(item.status || '').toLowerCase();

        // Income/earnings
        const isIncome =
          type === 'income' ||
          type === 'rent' ||
          type === 'deposit' ||
          type === 'earning' ||
          method === 'income';

        if (isIncome) {
          if (
            status === 'paid' ||
            status === 'completed' ||
            status === 'success' ||
            status === 'confirmed' ||
            status === 'approved'
          ) {
            total_earnings += amt;
            available_balance += amt;
          }
          else if (status === 'pending') {
            pending_balance += amt;
          }
        }
      });

      // Calculate withdrawals from dedicated withdrawals table
      withdrawalRows.forEach(item => {
        const amt = Number(item.amount || 0);
        const status = String(item.status || '').toLowerCase();

        if (status === 'paid' || status === 'completed' || status === 'success' || status === 'approved') {
          total_withdrawn += amt;
          available_balance -= amt;
        } else if (status === 'pending') {
          available_balance -= amt; // optionally deduct or keep tracked as pending withdrawal
        }
      });

      res.json({
        wallet: {
          available_balance,
          pending_balance,
          total_earnings,
          total_withdrawn
        },
        transactions: walletRows
      });
    });
  });
});

// Get Withdrawal Requests and Balance Combined for the Withdrawals Page using the separate withdrawals table
WalletRouter.get('/withdrawals/user_id/:id', (req, res) => {
  const { id } = req.params;

  const walletQuery = `
    SELECT *
    FROM wallet
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  const withdrawalQuery = `
    SELECT *
    FROM withdrawals
    WHERE owner_id = ?
    ORDER BY date DESC
  `;

  mysqlconnection.query(walletQuery, [id], (error, walletRows) => {
    if (error) {
      console.log(error);
      return res.status(500).json({
        message: "Database error",
        error
      });
    }

    mysqlconnection.query(
      withdrawalQuery,
      [id],
      (err2, withdrawalRows) => {
        if (err2) {
          console.log(err2);
          return res.status(500).json({
            message: "Database error",
            error: err2
          });
        }

        let available_balance = 0;
        let pending_balance = 0;
        let total_earnings = 0;
        let total_withdrawn = 0;

        // =========================
        // WALLET
        // =========================
        walletRows.forEach(item => {
          const amount = Number(item.amount || 0);

          const type = String(item.type || '').toLowerCase().trim();
          const status = String(item.status || '').toLowerCase().trim();

          // Your database has:
          // type = rent
          // method = Income
          // status = confirmed

          const isIncome =
            type === 'income' ||
            type === 'deposit' ||
            type === 'earning' ||
            type === 'rent';

          const isConfirmed =
            status === 'paid' ||
            status === 'completed' ||
            status === 'success' ||
            status === 'confirmed';

          if (isIncome) {
            if (isConfirmed) {
              total_earnings += amount;
              available_balance += amount;
            } else if (status === 'pending') {
              pending_balance += amount;
            }
          }
        });

        // =========================
        // WITHDRAWALS
        // =========================
        withdrawalRows.forEach(item => {
          const amount = Number(item.amount || 0);
          const status = String(item.status || '').toLowerCase().trim();

          if (
            status === 'paid' ||
            status === 'completed' ||
            status === 'success' ||
            status === 'approved'
          ) {
            total_withdrawn += amount;
            available_balance -= amount;
          }

          // Pending withdrawals should not be available
          else if (status === 'pending') {
            available_balance -= amount;
          }
        });

        console.log("Wallet rows:", walletRows);
        console.log("Withdrawal rows:", withdrawalRows);

        console.log({
          available_balance,
          pending_balance,
          total_earnings,
          total_withdrawn
        });

        res.json({
          wallet: {
            available_balance,
            pending_balance,
            total_earnings,
            total_withdrawn
          },
          requests: withdrawalRows
        });
      }
    );
  });
});

// Post a New Withdrawal Request directly into the dedicated withdrawals table
WalletRouter.post('/withdrawals/request', (req, res) => {
  const { owner_id, method, account, amount } = req.body;
  const userId = owner_id || req.body.user_id;

  // Validate user
  if (!userId) {
    return res.status(400).json({
      message: "Owner ID is required"
    });
  }

  // Validate withdrawal amount
  const requestedAmount = Number(amount);

  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    return res.status(400).json({
      message: "Invalid withdrawal amount"
    });
  }

  if (!method || !account) {
    return res.status(400).json({
      message: "Method and account are required"
    });
  }

  // Get owner's wallet income
  const walletQuery = `
    SELECT *
    FROM wallet
    WHERE user_id = ?
  `;

  // Get owner's previous withdrawals
  const withdrawalQuery = `
    SELECT *
    FROM withdrawals
    WHERE owner_id = ?
  `;

  mysqlconnection.query(walletQuery, [userId], (err, walletRows) => {
    if (err) {
      console.log(err);

      return res.status(500).json({
        message: "Database error",
        error: err
      });
    }

    mysqlconnection.query(
      withdrawalQuery,
      [userId],
      (err2, withdrawalRows) => {
        if (err2) {
          console.log(err2);

          return res.status(500).json({
            message: "Database error",
            error: err2
          });
        }

        let available_balance = 0;

        // =====================================
        // CALCULATE OWNER'S AVAILABLE BALANCE
        // =====================================

        walletRows.forEach(item => {
          const amt = Number(item.amount || 0);

          const type = String(item.type || '')
            .toLowerCase()
            .trim();

          const status = String(item.status || '')
            .toLowerCase()
            .trim();

          // Your database uses:
          // type = rent
          // method = Income
          // status = confirmed

          const isIncome =
            type === 'income' ||
            type === 'deposit' ||
            type === 'earning' ||
            type === 'rent';

          const isConfirmed =
            status === 'paid' ||
            status === 'completed' ||
            status === 'success' ||
            status === 'confirmed';

          if (isIncome && isConfirmed) {
            available_balance += amt;
          }
        });

        // =====================================
        // SUBTRACT PREVIOUS WITHDRAWALS
        // =====================================

        withdrawalRows.forEach(item => {
          const amt = Number(item.amount || 0);

          const status = String(item.status || '')
            .toLowerCase()
            .trim();

          if (
            status === 'approved' ||
            status === 'pending'
          ) {
            available_balance -= amt;
          }
        });

        console.log("Owner ID:", userId);
        console.log("Available balance:", available_balance);
        console.log("Requested amount:", requestedAmount);

        // =====================================
        // CHECK BALANCE
        // =====================================

        if (requestedAmount > available_balance) {
          return res.status(400).json({
            success: false,
            message: `Insufficient balance. Available balance: $${available_balance.toFixed(2)}`,
            available_balance
          });
        }

        // =====================================
        // CREATE WITHDRAWAL REQUEST
        // =====================================

        const insertQuery = `
          INSERT INTO withdrawals
          (
            owner_id,
            date,
            method,
            account,
            amount,
            status,
            created_at
          )
          VALUES (?, NOW(), ?, ?, ?, 'pending', NOW())
        `;

        mysqlconnection.query(
          insertQuery,
          [
            userId,
            method,
            account,
            requestedAmount
          ],
          (insertErr, result) => {
            if (insertErr) {
              console.log(insertErr);

              return res.status(500).json({
                success: false,
                message: "Failed to create withdrawal request",
                error: insertErr
              });
            }

            const newBalance =
              available_balance - requestedAmount;

            res.status(200).json({
              success: true,
              request_id: result.insertId,
              message: "Withdrawal requested successfully",
              amount: requestedAmount,
              previous_balance: available_balance,
              available_balance: newBalance
            });
          }
        );
      }
    );
  });
});

// Standard user wallet list endpoint
WalletRouter.get('/user_id/:id', (req, res) => {
  const { id } = req.params;
  mysqlconnection.query('SELECT * FROM wallet WHERE user_id = ? ORDER BY created_at DESC', [id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json(error);
    }
  });
});

// Add standard wallet record
WalletRouter.post('/add', (req, res) => {
  const { user_id, title, type, amount, method, status, created_at } = req.body;
  mysqlconnection.query(
    'INSERT INTO wallet (user_id, title, type, amount, method, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user_id, title, type, amount, method, status || 'pending', created_at || new Date()],
    (error, rows) => {
      if (!error) {
        res.status(200).json({
          message: "Wallet entry created successfully",
          wallet_id: rows.insertId
        });
      } else {
        console.log(error);
        res.status(500).json(error);
      }
    }
  );
});

// Delete wallet item
WalletRouter.delete('/delete/:id', (req, res) => {
  const id = req.params.id;
  mysqlconnection.query('DELETE FROM wallet WHERE id = ?', [id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      res.status(500).json({ status: error });
    }
  });
});

module.exports = WalletRouter;