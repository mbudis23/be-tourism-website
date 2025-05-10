const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../config/db'); // sesuaikan path-nya

exports.insertTourismPackages = async (req, res) => {
  const filePath = '/home/budi-setiawan/Documents/gdgoc/be-tourism-website/db_query/package_tourism.csv'; // ganti sesuai path file kamu
  const packages = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        packages.push({
          city: row.City,
          place_tourism1: row.Place_Tourism1 || null,
          place_tourism2: row.Place_Tourism2 || null,
          place_tourism3: row.Place_Tourism3 || null,
          place_tourism4: row.Place_Tourism4 || null,
          place_tourism5: row.Place_Tourism5 || null
        });
      })
      .on('end', async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const queryText = `
            INSERT INTO tourism_packages 
              (city, place_tourism1, place_tourism2, place_tourism3, place_tourism4, place_tourism5)
            VALUES ($1, $2, $3, $4, $5, $6)
          `;

          for (const item of packages) {
            await client.query(queryText, [
              item.city,
              item.place_tourism1,
              item.place_tourism2,
              item.place_tourism3,
              item.place_tourism4,
              item.place_tourism5
            ]);
          }

          await client.query('COMMIT');
          res.status(200).json({ message: `${packages.length} tourism packages inserted.` });
        } catch (err) {
          await client.query('ROLLBACK');
          console.error('Insert error:', err);
          res.status(500).json({ error: 'Insert to tourism_packages failed' });
        } finally {
          client.release();
        }
      })
      .on('error', (err) => {
        console.error('CSV read error:', err);
        res.status(500).json({ error: 'Failed to read CSV file' });
      });
  } catch (err) {
    console.error('General error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// exports.SearchTourism = async (req, res) => {
//   const 
// }