const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// Google Sign In
router.post('/google-signin', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    
    // Find or create user
    let user = await User.findOne({ googleId: payload.sub });
    
    if (!user) {
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        displayName: payload.name,
        picture: payload.picture
      });
    }

    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    res.send({ user, token: jwtToken });
  } catch (error) {
    console.error('Google signin error:', error);
    res.status(400).send({ error: 'Authentication failed' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    await req.user.populate('wondersCount');
    res.send(req.user);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching profile' });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['displayName', 'explorerLocation'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router; 