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
const aiRoutes = require("./routes/aiRoutes")

const corsOptions = {
    origin: ["http://localhost:3000", "*", "https://fe-tourism-website.vercel.app/"],
    credentials: true
  };

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/users', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/ai/', aiRoutes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
