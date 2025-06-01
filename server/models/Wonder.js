const mongoose = require('mongoose');
const slugify = require('slugify');

const wonderSchema = new mongoose.Schema({
  // Core Identification
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['nature', 'historical', 'caves', 'urban', 'viewpoints', 'water']
  },
  subcategory: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },

  // Geographic Information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },

  // Descriptive Information
  description: {
    type: String,
    required: true,
    trim: true
  },
  history: {
    type: String,
    trim: true
  },
  accessibility: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'expert'],
    default: 'moderate'
  },
  safetyWarnings: {
    type: String,
    trim: true
  },
  visitingTips: {
    type: String,
    trim: true
  },

  // Media
  coverImage: {
    url: String,
    caption: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  photos: [{
    url: String,
    caption: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  videos: [{
    url: String,
    caption: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // User Interaction
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Moderation
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  moderationNotes: {
    type: String,
    trim: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a 2dsphere index for geospatial queries
wonderSchema.index({ location: '2dsphere' });

// Generate slug before saving
wonderSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  this.updatedAt = Date.now();
  next();
});

const Wonder = mongoose.model('Wonder', wonderSchema);

module.exports = Wonder; 