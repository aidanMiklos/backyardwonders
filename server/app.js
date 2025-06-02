const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const wonderRoutes = require('./routes/wonders');
const userRoutes = require('./routes/users');
const wonderRevisionRoutes = require('./routes/wonderRevisions');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', wonderRoutes);
app.use('/api', userRoutes);
app.use('/api', wonderRevisionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app; 