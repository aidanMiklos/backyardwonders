const express = require('express');
const router = express.Router();
const multer = require('multer');
const Wonder = require('../models/Wonder');
const auth = require('../middleware/auth');
const { uploadImage } = require('../utils/storage');

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
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json(wonders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching wonders' });
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
    }).populate('createdBy', 'name');
    
    res.json(wonders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching nearby wonders' });
  }
});

// Create a new wonder
router.post('/', auth, upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, category, subcategory, latitude, longitude, country } = req.body;
    
    let coverImage = null;
    let additionalImages = [];

    // Upload images if provided
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      // First image is cover image
      coverImage = {
        url: uploadedUrls[0],
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      };

      // Rest are additional images
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
      createdBy: req.user._id
    });

    await wonder.save();
    await wonder.populate('createdBy', 'name');
    res.status(201).json(wonder);
  } catch (err) {
    console.error('Error creating wonder:', err);
    res.status(400).json({ message: 'Error creating wonder' });
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
    await wonder.populate('createdBy', 'name');
    res.json(wonder);
  } catch (err) {
    console.error('Error updating wonder:', err);
    res.status(400).json({ message: 'Error updating wonder' });
  }
});

// Delete a wonder
router.delete('/:id', auth, async (req, res) => {
  try {
    const wonder = await Wonder.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.user._id 
    });
    
    if (!wonder) {
      return res.status(404).json({ message: 'Wonder not found or unauthorized' });
    }
    
    res.json({ message: 'Wonder deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting wonder' });
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
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if user already rated this wonder
    const existingRatingIndex = wonder.ratings.findIndex(r => r.user.equals(userId));

    if (existingRatingIndex > -1) {
      // Update existing rating
      wonder.ratings[existingRatingIndex].rating = rating;
      wonder.ratings[existingRatingIndex].comment = comment || '';
      wonder.ratings[existingRatingIndex].createdAt = Date.now();
    } else {
      // Add new rating
      wonder.ratings.push({ user: userId, rating, comment: comment || '', createdAt: Date.now() });
    }

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
    res.status(201).json(wonder);

  } catch (err) {
    console.error('Error adding rating:', err);
    res.status(500).json({ message: 'Error adding rating' });
  }
});

module.exports = router; 