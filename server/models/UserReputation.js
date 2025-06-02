const mongoose = require('mongoose');

const userReputationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trustScore: {
    type: Number,
    default: 0
  },
  // Track different types of contributions
  contributions: {
    successfulEdits: {
      type: Number,
      default: 0
    },
    approvedEdits: {
      type: Number,
      default: 0
    },
    rejectedEdits: {
      type: Number,
      default: 0
    },
    revertedEdits: {
      type: Number,
      default: 0
    },
    photosUploaded: {
      type: Number,
      default: 0
    },
    reviewsWritten: {
      type: Number,
      default: 0
    },
    helpfulVotes: {
      type: Number,
      default: 0
    }
  },
  // Track achievements and badges
  achievements: [{
    type: {
      type: String,
      enum: [
        'FIRST_EDIT',
        'EDIT_STREAK',
        'PHOTO_CONTRIBUTOR',
        'LOCATION_EXPERT',
        'REGIONAL_CURATOR',
        'TRUSTED_EDITOR',
        'HELPFUL_REVIEWER',
        'FACT_CHECKER'
      ]
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }],
  // Track edit streaks
  editStreak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastEditDate: Date
  },
  // Track expertise in specific regions or categories
  expertise: [{
    type: {
      type: String,
      enum: ['region', 'category']
    },
    value: String, // region name or category name
    level: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    contributions: {
      type: Number,
      default: 0
    }
  }],
  // Monthly stats for featured contributors
  monthlyStats: {
    month: Number,
    year: Number,
    edits: Number,
    approvedEdits: Number,
    helpfulVotes: Number,
    lastUpdated: Date
  }
});

// Index for efficient queries
userReputationSchema.index({ user: 1 });
userReputationSchema.index({ 'monthlyStats.month': 1, 'monthlyStats.year': 1 });
userReputationSchema.index({ trustScore: -1 });

const UserReputation = mongoose.model('UserReputation', userReputationSchema);

module.exports = UserReputation; 