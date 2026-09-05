const { Router } = require('express');
const WithdrawalRouter = Router();
const mysqlconnection = require('../dstsbase/database.js');

// Get all withdrawals
WithdrawalRouter.get('/all', (req, res) => {
  const query = `SELECT * FROM withdrawals ORDER BY date DESC`;
  mysqlconnection.query(query, (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json(error);
    }
  });
});

// Get withdrawals by owner/user ID
WithdrawalRouter.get('/user_id/:id', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM withdrawals WHERE owner_id = ? ORDER BY date DESC`;
  
  mysqlconnection.query(query, [id], (error, rows) => {
    if (!error) {
      res.json(rows);
    } else {
      console.log(error);
      res.status(500).json(error);
    }
  });
});

// Create a new withdrawal request
WithdrawalRouter.post('/add', (req, res) => {
  const { owner_id, method, account, amount, status } = req.body;

  const query = `
    INSERT INTO withdrawals (owner_id, date, method, account, amount, status) 
    VALUES (?, NOW(), ?, ?, ?, ?)
  `;

  mysqlconnection.query(
    query, 
    [owner_id, method, account, amount, status || 'pending'], 
    (error, result) => {
      if (!error) {
        res.status(200).json({
          message: "Withdrawal request created successfully",
          request_id: result.insertId
        });
      } else {
        console.log(error);
        res.status(500).json({ error: 'Failed to create withdrawal', details: error.message });
      }
    }
  );
});

// Update withdrawal status (e.g., pending -> approved/paid/rejected)
WithdrawalRouter.put('/update/:id', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  const query = `
    UPDATE withdrawals 
    SET status = ? 
    WHERE id = ?;
  `;

  mysqlconnection.query(query, [status, id], (error, result) => {
    if (error) {
      console.error('Error updating withdrawal:', error);
      return res.status(500).json({
        error: 'Failed to update withdrawal status',
        details: error.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    res.status(200).json({
      message: 'Withdrawal status updated successfully',
      id: id,
      status: status
    });
  });
});

// Delete a withdrawal request
WithdrawalRouter.delete('/delete/:id', (req, res) => {
  const id = req.params.id;
  const query = `DELETE FROM withdrawals WHERE id = ?`;

  mysqlconnection.query(query, [id], (error, rows) => {
    if (!error) {
      res.json({ message: "Withdrawal deleted successfully", rows });
    } else {
      console.log(error);
      res.status(500).json({ status: error });
    }
  });
});

module.exports = WithdrawalRouter;