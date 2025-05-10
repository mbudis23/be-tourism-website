const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');

dotenv.config();

const app = express();

// Import routes
const userRoutes = require('./routes/userRoutes');
const placeRoutes = require('./routes/placeRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const packageRoutes = require('./routes/packageRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Import DB pool
const pool = require('./config/db');

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:3000", "https://fe-tourism-website.vercel.app"],
  methods: ['GET', 'POST'],
  credentials: true, // jika kamu gunakan cookie atau auth header
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/ai', aiRoutes);

// Health check & DB test route
app.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
