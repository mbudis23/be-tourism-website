const express = require('express');
const app = express();
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
dotenv.config();
const userRoutes = require('./routes/userRoutes');
const placeRoutes = require('./routes/placeRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const packageRoutes = require('./routes/packageRoutes');
const aiRoutes = require("./routes/aiRoutes");
const pool = require('./config/db');
const corsOptions = {
    origin: ["http://localhost:3000", "*", "https://fe-tourism-website.vercel.app/", "https://fe-tourism-website.vercel.app/search"],
    credentials: true
  };

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/users', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/ai/', aiRoutes)
app.get('/', async (req, res) => {
  try {
    const client = await pool.connect(); // Coba koneksi ke DB
    await client.query('SELECT NOW()');  // Tes query
    client.release(); // Kembalikan koneksi ke pool

    return res.json({
      status: "Connected to server and database"
    });
  } catch (err) {
    console.error('Database connection error:', err.message);
    return res.status(500).json({
      status: "Connected to server, but failed to connect to database",
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
