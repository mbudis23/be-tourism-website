const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../config/db'); // pastikan path sesuai

exports.insertTourismPlaces = async (req, res) => {
  const filePath = '/home/budi-setiawan/Documents/gdgoc/be-tourism-website/db_query/tourism_with_id.csv';
  const places = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Perbaikan parsing
        let parsedCoordinate;
        try {
          // ganti single quote menjadi double quote agar bisa di-parse ke JSON
          parsedCoordinate = JSON.parse(row.Coordinate.replace(/'/g, '"'));
        } catch {
          parsedCoordinate = null; // fallback jika parsing gagal
        }

        places.push({
          place_id: parseInt(row.Place_Id),
          place_name: row.Place_Name,
          description: row.Description,
          category: row.Category,
          city: row.City,
          price: isNaN(parseInt(row.Price)) ? 0 : parseInt(row.Price),
          rating: isNaN(parseFloat(row.Rating)) ? null : parseFloat(row.Rating),
          time_minutes: row.Time_Minutes && !isNaN(row.Time_Minutes) ? parseInt(row.Time_Minutes) : null,
          coordinate: parsedCoordinate ? JSON.stringify(parsedCoordinate) : null,
          lat: isNaN(parseFloat(row.Lat)) ? null : parseFloat(row.Lat),
          long: isNaN(parseFloat(row.Long)) ? null : parseFloat(row.Long)
        });
      })
      .on('end', async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const queryText = `
            INSERT INTO tourism_places 
            (place_id, place_name, description, category, city, price, rating, time_minutes, coordinate, lat, long) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `;

          for (const place of places) {
            try {
              await client.query(queryText, [
                place.place_id,
                place.place_name,
                place.description,
                place.category,
                place.city,
                place.price,
                place.rating,
                place.time_minutes,
                place.coordinate,
                place.lat,
                place.long
              ]);
            } catch (insertErr) {
              console.error('Insert error for row:', place);
              console.error(insertErr);
              throw insertErr; // menyebabkan rollback
            }
          }

          await client.query('COMMIT');
          res.status(200).json({ message: `${places.length} tourism places inserted successfully.` });
        } catch (err) {
          await client.query('ROLLBACK');
          res.status(500).json({ error: 'Failed to insert tourism places into database' });
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

exports.getPopularDestination = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM get_random_places(3)");
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getPopularDestination:', err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  } finally {
    client.release();
  }
};

// exports.searchTourismPlaces = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const keyword = req.params.keyword;
//     const limit = parseInt(req.params.limit, 10);
//     const offset = parseInt(req.params.offset, 10);

//     const result = await client.query(
//       'SELECT * FROM SEARCH_TOURISM_PLACES($1, $2::int, $3::int)',
//       [keyword, limit, offset]
//     );

//     res.status(200).json({
//       success: true,
//       data: result.rows
//     });
//   } catch (err) {
//     console.error('Error during searchTourismPlaces:', err);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error"
//     });
//   } finally {
//     client.release();
//   }
// };

exports.searchTourismPlaces = async (req, res) => {
  const client = await pool.connect();

  try {
    const keyword = req.params.keyword;
    const limit = parseInt(req.params.limit, 10);
    const offset = parseInt(req.params.offset, 10);

    // Ambil dari query string: /search/pantai/10/0?city=Semarang&category=Budaya
    const city = req.query.city || null;
    const category = req.query.category || null;

    const result = await client.query(
      'SELECT * FROM search_tourism_placesv2($1, $2, $3, $4::int, $5::int)',
      [keyword, city, category, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error during searchTourismPlaces:', err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  } finally {
    client.release();
  }
};

exports.searchTourismPlacesAI = async (req, res) => {
  try {
    const userQuery = req.body.query;
    const cityFilter = req.body.city || 'Yogyakarta';
    const limitValue = req.body.limit || 10;

    if (!userQuery) {
      return res.status(400).json({ error: 'Kueri pencarian tidak boleh kosong.' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = 'gemini-2.0-flash'; // Gunakan model yang sesuai dengan API
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

    try {
      const geminiResponse = await axios.post(geminiApiUrl, {
        contents: [{
          parts: [{ text: `Sebagai asisten pencarian tempat wisata di ${cityFilter}, interpretasikan kueri pengguna berikut dan ekstrak informasi relevan seperti jenis tempat dan kata kunci utama. Koreksi juga jika ada typo. Berikan jawaban dalam format JSON dengan kunci: "jenis_tempat", "kata_kunci".\n\nKueri: "${userQuery}"` }]
        }]
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const geminiResultText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!geminiResultText) {
        return res.status(500).json({ error: 'Gagal mendapatkan interpretasi dari Gemini API.' });
      }

      let geminiInterpretation;
      try {
        geminiInterpretation = JSON.parse(geminiResultText);
      } catch (error) {
        console.error('Gagal mem-parsing JSON dari Gemini:', geminiResultText, error);
        return res.status(500).json({ error: 'Gagal memproses interpretasi dari Gemini.' });
      }

      const { kata_kunci, jenis_tempat } = geminiInterpretation;

      const query = 'SELECT * FROM search_tourism_places_ai_v2($1, $2, $3)';
      const values = [userQuery, cityFilter, limitValue]; // Kita mengirim userQuery agar logika mock di SQL bisa bekerja

      const result = await pool.query(query, values);
      res.json({ success: true, location: cityFilter, recommendations: result.rows });

    } catch (error) {
      console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
      return res.status(500).json({ error: 'Gagal berkomunikasi dengan Gemini API.' });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mencari tempat.' });
  }
};