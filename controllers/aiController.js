const pool = require('../config/db');
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Util: ambil detail + rating + jumlah voter dari satu nama tempat
async function getPlaceStats(placeName) {
  const placeResult = await pool.query(
    'SELECT * FROM tourism_places WHERE LOWER(place_name) = LOWER($1) LIMIT 1',
    [placeName]
  );
  if (placeResult.rows.length === 0) return null;

  const place = placeResult.rows[0];

  const ratingResult = await pool.query(
    `SELECT AVG(place_ratings)::FLOAT as rating, COUNT(user_id)::INT as count_people
     FROM tourism_ratings WHERE place_id = $1`, [place.place_id]
  );

  return {
    place_id: place.place_id,
    place_name: place.place_name,
    rating: ratingResult.rows[0].rating?.toString() || "0",
    count_people: ratingResult.rows[0].count_people?.toString() || "0",
    category: place.category,
    description: place.description,
  };
}

// Controller utama
exports.searchAI = async (req, res) => {
  const { query } = req.body;

  try {
    const allPlaces = await pool.query('SELECT place_name FROM tourism_places');
    const placeNames = allPlaces.rows.map(p => p.place_name);

    const prompt = `You are given a list of tourism destinations:\n${placeNames.join('\n')}\n\nGiven the search term "${query}", return up to 10 destination names from the list that best match the query, even if it contains typos or vague wording. Return as plain list, one per line.`;

    const geminiResp = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const candidates = geminiResp.data.candidates;
    if (!candidates || !candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Gemini response format unexpected:', geminiResp.data);
      return res.status(500).json({ success: false, error: 'Gemini response invalid' });
    }

    const lines = candidates[0].content.parts[0].text.split('\n');
    const cleanedNames = lines.map(name => name.trim()).filter(name => name.length > 0);

    const resultData = [];
    for (let name of cleanedNames) {
      const data = await getPlaceStats(name);
      if (data) {
        resultData.push(data);
      } else {
        console.warn(`Not found in DB: "${name}"`);
      }
    }

    if (resultData.length === 0) {
      return res.status(404).json({ success: false, error: 'No matching results found in database.' });
    }

    res.json({ success: true, data: resultData });

  } catch (err) {
    console.error('Server Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
