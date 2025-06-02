const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wonder = require('../models/Wonder');
const UserReputation = require('../models/UserReputation');

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
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        displayName: payload.name,
        picture: payload.picture
      });
    }

    user.lastLogin = new Date();
    await user.save();

    // Create reputation record for new users
    if (isNewUser) {
      const reputation = new UserReputation({
        user: user._id,
        trustScore: 0
      });
      await reputation.save();
    }

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
    // Ensure virtuals are populated, including wondersCount and a new reviewsCount
    await req.user.populate('wondersCount');
    
    // Get user reputation
    let reputation = await UserReputation.findOne({ user: req.user._id });
    if (!reputation) {
      // Create reputation if it doesn't exist (for existing users)
      reputation = new UserReputation({
        user: req.user._id,
        trustScore: 0
      });
      await reputation.save();
    }
    
    // Manually count reviews by this user
    const wondersWithUserReviews = await Wonder.find({ "ratings.user": req.user._id });
    let reviewCount = 0;
    wondersWithUserReviews.forEach(wonder => {
      wonder.ratings.forEach(rating => {
        if (rating.user.equals(req.user._id)) {
          reviewCount++;
        }
      });
    });

    // Send a combined user object
    const userProfile = req.user.toObject(); // Convert to plain object to add properties
    userProfile.reviewsCount = reviewCount;
    userProfile.reputation = reputation;

    res.send(userProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send({ error: 'Error fetching profile: ' + error.message });
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