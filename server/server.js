require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const wonderRoutes = require('./routes/wonderRoutes');

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://frontend-2-abhz.onrender.com',
    'https://backyardwonders.onrender.com',
    'https://backyardwonders-frontend.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/backyardwonders')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/wonders', wonderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment variables loaded:');
  console.log('- GOOGLE_CLOUD_PROJECT_ID:', process.env.GOOGLE_CLOUD_PROJECT_ID ? '✓' : '✗');
  console.log('- GOOGLE_CLOUD_BUCKET:', process.env.GOOGLE_CLOUD_BUCKET ? '✓' : '✗');
  console.log('- GOOGLE_CLOUD_KEYFILE:', process.env.GOOGLE_CLOUD_KEYFILE ? '✓' : '✗');
}); 