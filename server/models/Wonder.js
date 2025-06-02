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
  // Initial Contributor
  initialContributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contributedAt: {
    type: Date,
    default: Date.now
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

  // Wiki-style Content Sections
  content: {
    overview: {
      text: {
        type: String,
        required: true,
        trim: true
      },
      lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lastEditedAt: Date
    },
    history: {
      text: {
        type: String,
        trim: true
      },
      lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lastEditedAt: Date
    },
    geography: {
      text: {
        type: String,
        trim: true
      },
      lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lastEditedAt: Date
    },
    floraAndFauna: {
      text: {
        type: String,
        trim: true
      },
      lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lastEditedAt: Date
    },
    culturalSignificance: {
      text: {
        type: String,
        trim: true
      },
      lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lastEditedAt: Date
    },
    visitingInfo: {
      text: {
        type: String,
        trim: true
      },
      lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lastEditedAt: Date
    },
    safetyGuidelines: {
      text: {
        type: String,
        trim: true
      },
      lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lastEditedAt: Date
    }
  },

  // References and Citations
  references: [{
    text: String,
    url: String,
    type: {
      type: String,
      enum: ['website', 'book', 'article', 'scientific_paper', 'other']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

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
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'disputed'],
      default: 'pending'
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
  contributors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['creator', 'major_contributor', 'contributor', 'photo_contributor']
    },
    contributions: {
      edits: Number,
      photos: Number,
      reviews: Number
    },
    firstContributedAt: {
      type: Date,
      default: Date.now
    }
  }],
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

  // Moderation and Quality Control
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'featured', 'disputed'],
    default: 'pending'
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  completenessScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  moderationNotes: [{
    note: String,
    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Protection Level
  protectionLevel: {
    type: String,
    enum: ['none', 'semi-protected', 'fully-protected'],
    default: 'none'
  },
  protectionReason: String,
  protectionExpiresAt: Date,

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

// Calculate completeness score before saving
wonderSchema.pre('save', function(next) {
  let score = 0;
  const totalFields = 8; // Total number of main content sections

  // Check each content section
  if (this.content) {
    if (this.content.overview?.text) score++;
    if (this.content.history?.text) score++;
    if (this.content.geography?.text) score++;
    if (this.content.floraAndFauna?.text) score++;
    if (this.content.culturalSignificance?.text) score++;
    if (this.content.visitingInfo?.text) score++;
    if (this.content.safetyGuidelines?.text) score++;
  }

  // Check for photos
  if (this.photos && this.photos.length > 0) score++;

  this.completenessScore = Math.round((score / totalFields) * 100);
  next();
});

const Wonder = mongoose.model('Wonder', wonderSchema);

module.exports = Wonder; 