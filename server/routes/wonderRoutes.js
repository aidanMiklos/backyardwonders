const express = require('express');
const router = express.Router();
const multer = require('multer');
const Wonder = require('../models/Wonder');
const auth = require('../middleware/auth');
const { superadminAuth } = require('../middleware/adminAuth');
const { uploadImage } = require('../utils/storage');
const mongoose = require('mongoose');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Get all wonders
router.get('/', async (req, res) => {
  try {
    const wonders = await Wonder.find()
      .populate('createdBy', 'displayName picture')
      .populate('ratings.user', 'displayName picture')
      .sort('-createdAt');
    res.json(wonders);
  } catch (err) {
    console.error('Error fetching wonders:', err);
    res.status(500).json({ message: 'Error fetching wonders: ' + err.message });
  }
});

// Get wonders within a radius (in kilometers) of a point
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  
  try {
    const wonders = await Wonder.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert to meters
        }
      }
    }).populate('createdBy', 'displayName picture')
      .populate('ratings.user', 'displayName picture');
    
    res.json(wonders);
  } catch (err) {
    console.error('Error fetching nearby wonders:', err);
    res.status(500).json({ message: 'Error fetching nearby wonders: ' + err.message });
  }
});

// Get a single wonder by ID or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    let wonder;
    
    // First try to find by ID
    if (mongoose.Types.ObjectId.isValid(req.params.idOrSlug)) {
      wonder = await Wonder.findById(req.params.idOrSlug)
        .populate('createdBy', 'displayName picture')
        .populate('ratings.user', 'displayName picture');
    }
    
    // If not found by ID, try to find by slug
    if (!wonder) {
      wonder = await Wonder.findOne({ slug: req.params.idOrSlug })
        .populate('createdBy', 'displayName picture')
        .populate('ratings.user', 'displayName picture');
    }

    if (!wonder) {
      return res.status(404).json({ message: 'Wonder not found' });
    }
    
    res.json(wonder);
  } catch (err) {
    console.error(`Error fetching wonder ${req.params.idOrSlug}:`, err);
    res.status(500).json({ message: 'Error fetching wonder: ' + err.message });
  }
});

// Create a new wonder
router.post('/', auth, upload.array('images', 10), async (req, res) => {
  try {
    const { 
      name, 
      description, 
      category, 
      subcategory, 
      latitude, 
      longitude, 
      country, 
      history,
      difficulty, 
      safetyWarnings, 
      visitingTips 
    } = req.body;

    // Parse accessibility fields from form data
    const accessibility = {
      isWheelchairAccessible: req.body['accessibility.isWheelchairAccessible'] === 'true',
      hasAccessibleParking: req.body['accessibility.hasAccessibleParking'] === 'true',
      hasAccessibleRestrooms: req.body['accessibility.hasAccessibleRestrooms'] === 'true',
      hasAccessiblePathways: req.body['accessibility.hasAccessiblePathways'] === 'true',
      accessibilityNotes: req.body['accessibility.accessibilityNotes'] || ''
    };
    
    let coverImage = null;
    let additionalImages = [];

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      coverImage = {
        url: uploadedUrls[0],
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      };
      additionalImages = uploadedUrls.slice(1).map(url => ({ 
        url, 
        uploadedBy: req.user._id, 
        uploadedAt: new Date() 
      }));
    }

    const wonder = new Wonder({
      name,
      description,
      category,
      subcategory,
      country,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      coverImage,
      photos: additionalImages,
      createdBy: req.user._id,
      history,
      accessibility,
      difficulty,
      safetyWarnings,
      visitingTips
    });

    await wonder.save();
    await wonder.populate('createdBy', 'displayName picture');
    res.status(201).json(wonder);
  } catch (err) {
    console.error('Error creating wonder:', err);
    res.status(400).json({ message: 'Error creating wonder: ' + err.message });
  }
});

// Update a wonder
router.put('/:id', auth, upload.array('images', 10), async (req, res) => {
  try {
    const wonder = await Wonder.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!wonder) {
      return res.status(404).json({ message: 'Wonder not found or unauthorized' });
    }

    const { name, description, category, subcategory, latitude, longitude, country } = req.body;
    
    // Upload new images if provided
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      wonder.coverImage = {
        url: uploadedUrls[0],
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      };

      wonder.photos = uploadedUrls.slice(1).map(url => ({
        url,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      }));
    }

    wonder.name = name;
    wonder.description = description;
    wonder.category = category;
    wonder.subcategory = subcategory;
    wonder.country = country;
    wonder.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    await wonder.save();
    await wonder.populate('createdBy', 'displayName picture');
    res.json(wonder);
  } catch (err) {
    console.error('Error updating wonder:', err);
    res.status(400).json({ message: 'Error updating wonder' });
  }
});

// Delete a wonder (superadmin only)
router.delete('/:id', auth, superadminAuth, async (req, res) => {
  try {
    const wonder = await Wonder.findByIdAndDelete(req.params.id);
    
    if (!wonder) {
      return res.status(404).json({ message: 'Wonder not found' });
    }
    
    res.json({ message: 'Wonder deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting wonder' });
  }
});

// Delete a rating (superadmin only)
router.delete('/:wonderId/ratings/:ratingId', auth, superadminAuth, async (req, res) => {
  try {
    const wonder = await Wonder.findById(req.params.wonderId);
    if (!wonder) {
      return res.status(404).json({ message: 'Wonder not found' });
    }

    // Remove the rating
    wonder.ratings = wonder.ratings.filter(rating => 
      !rating._id.equals(req.params.ratingId)
    );

    // Recalculate average rating and rating count
    wonder.ratingCount = wonder.ratings.length;
    if (wonder.ratingCount > 0) {
      const totalRating = wonder.ratings.reduce((acc, curr) => acc + curr.rating, 0);
      wonder.averageRating = parseFloat((totalRating / wonder.ratingCount).toFixed(1));
    } else {
      wonder.averageRating = 0;
    }

    await wonder.save();
    await wonder.populate([
      { path: 'createdBy', select: 'displayName picture' },
      { path: 'ratings.user', select: 'displayName picture' }
    ]);
    
    res.json(wonder);
  } catch (err) {
    console.error('Error deleting rating:', err);
    res.status(500).json({ message: 'Error deleting rating' });
  }
});

// Add a rating to a wonder
router.post('/:id/ratings', auth, async (req, res) => {
  try {
    const wonder = await Wonder.findById(req.params.id);
    if (!wonder) {
      return res.status(404).json({ message: 'Wonder not found' });
    }

    const { rating, comment } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if user has already rated
    const existingRatingIndex = wonder.ratings.findIndex(r => 
      r.user.toString() === req.user._id.toString()
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      wonder.ratings[existingRatingIndex] = {
        user: req.user._id,
        rating,
        comment,
        createdAt: new Date()
      };
    } else {
      // Add new rating
      wonder.ratings.push({
        user: req.user._id,
        rating,
        comment,
        createdAt: new Date()
      });
    }

    // Update average rating
    const totalRating = wonder.ratings.reduce((sum, r) => sum + r.rating, 0);
    wonder.averageRating = totalRating / wonder.ratings.length;

    await wonder.save();
    await wonder.populate('ratings.user', 'displayName picture');
    
    res.json(wonder);
  } catch (err) {
    console.error('Error adding rating:', err);
    res.status(500).json({ message: 'Error adding rating: ' + err.message });
  }
});

module.exports = router; 