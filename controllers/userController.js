const pool = require('../config/db');
const fs = require('fs');
const csv = require('csv-parser');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    console.log('Fetched all users');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [req.params.id]);
    console.log(`Fetched user with id ${req.params.id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching user ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  const { location, age } = req.body;
  try {
    const result = await pool.query('INSERT INTO users (location, age) VALUES ($1, $2) RETURNING *', [location, age]);
    console.log('Created user:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { location, age } = req.body;
  try {
    const result = await pool.query('UPDATE users SET location = $1, age = $2 WHERE user_id = $3 RETURNING *', [location, age, req.params.id]);
    console.log(`Updated user ${req.params.id}:`, result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating user ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE user_id = $1', [req.params.id]);
    console.log(`Deleted user with id ${req.params.id}`);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(`Error deleting user ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.insertUsers = async (req, res) => {
  const filePath = '/home/budi-setiawan/Documents/gdgoc/be-tourism-website/db_query/user.csv';
  const users = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        users.push({
          user_id: parseInt(row.user_id), // pastikan number
          location: row.location,
          age: parseInt(row.age)
        });
      })
      .on('end', async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const queryText = 'INSERT INTO users (user_id, location, age) VALUES ($1, $2, $3)';
          
          for (const user of users) {
            await client.query(queryText, [user.user_id, user.location, user.age]);
          }

          await client.query('COMMIT');
          res.status(200).json({ message: `${users.length} users inserted successfully.` });
        } catch (err) {
          await client.query('ROLLBACK');
          console.error('Insert error:', err);
          res.status(500).json({ error: 'Failed to insert users into database' });
        } finally {
          client.release();
        }
      })
      .on('error', (err) => {
        console.error('CSV read error:', err);
        res.status(500).json({ error: 'Failed to read CSV file' });
      });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};