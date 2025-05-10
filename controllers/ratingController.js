const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../config/db'); // sesuaikan path

exports.insertTourismRatings = async (req, res) => {
  const filePath = '/home/budi-setiawan/Documents/gdgoc/be-tourism-website/db_query/tourism_rating.csv'; // ganti dengan path file ratings kamu
  const ratings = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        ratings.push({
          user_id: parseInt(row.User_Id),
          place_id: parseInt(row.Place_Id),
          place_ratings: parseInt(row.Place_Ratings)
        });
      })
      .on('end', async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const queryText = `
            INSERT INTO tourism_ratings (user_id, place_id, place_ratings)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, place_id) DO UPDATE 
            SET place_ratings = EXCLUDED.place_ratings
          `;

          for (const rating of ratings) {
            try {
              await client.query(queryText, [
                rating.user_id,
                rating.place_id,
                rating.place_ratings
              ]);
            } catch (insertErr) {
              console.error('Insert error for row:', rating);
              console.error(insertErr);
              throw insertErr;
            }
          }

          await client.query('COMMIT');
          res.status(200).json({ message: `${ratings.length} ratings inserted/updated successfully.` });
        } catch (err) {
          await client.query('ROLLBACK');
          res.status(500).json({ error: 'Failed to insert tourism ratings into database' });
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
