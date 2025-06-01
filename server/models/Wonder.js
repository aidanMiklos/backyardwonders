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
    type: {
      isWheelchairAccessible: {
        type: Boolean,
        default: false
      },
      hasAccessibleParking: {
        type: Boolean,
        default: false
      },
      hasAccessibleRestrooms: {
        type: Boolean,
        default: false
      },
      hasAccessiblePathways: {
        type: Boolean,
        default: false
      },
      accessibilityNotes: {
        type: String,
        trim: true
      }
    },
    default: {}
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
wonderSchema.pre('save', async function(next) {
  try {
    if (!this.slug) {
      // Generate base slug from name
      let baseSlug = slugify(this.name, { lower: true, strict: true });
      
      // Add country to slug if it exists
      if (this.country) {
        baseSlug += `-${slugify(this.country, { lower: true, strict: true })}`;
      }
      
      // Check if the slug already exists
      let slug = baseSlug;
      let counter = 1;
      let slugExists = true;
      
      while (slugExists) {
        const existingWonder = await Wonder.findOne({ slug: slug, _id: { $ne: this._id } });
        if (!existingWonder) {
          slugExists = false;
        } else {
          // If slug exists, add coordinates (truncated to 2 decimal places)
          if (counter === 1 && this.location && this.location.coordinates) {
            const lat = this.location.coordinates[1].toFixed(2);
            const lng = this.location.coordinates[0].toFixed(2);
            slug = `${baseSlug}-${lat}-${lng}`;
          } else {
            // If still exists, append counter
            slug = `${baseSlug}-${counter}`;
            counter++;
          }
        }
      }
      
      this.slug = slug;
    }
    
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

const Wonder = mongoose.model('Wonder', wonderSchema);

module.exports = Wonder; 