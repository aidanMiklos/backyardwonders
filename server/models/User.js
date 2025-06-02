const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  picture: {
    type: String
  },
  explorerLocation: {
    type: String
  },
  role: {
    type: String,
    enum: [
      'Backyard Beginner',   // New users
      'Explorer',            // Users with some contributions
      'Trailblazer',        // Active contributors
      'WonderGuide',        // Trusted editors
      'RegionalCurator',    // Regional experts
      'ContentModerator',   // Can moderate content
      'admin',              // Full admin privileges
      'superadmin'          // System administrator
    ],
    default: 'Backyard Beginner'
  },
  reputation: {
    points: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    badges: [{
      type: {
        type: String,
        enum: [
          'contributor',
          'editor',
          'photographer',
          'reviewer',
          'curator',
          'expert',
          'moderator'
        ]
      },
      name: String,
      description: String,
      awardedAt: {
        type: Date,
        default: Date.now
      }
    }],
    achievements: [{
      type: {
        type: String,
        enum: [
          'first_contribution',
          'edit_streak',
          'photo_milestone',
          'review_milestone',
          'regional_expert',
          'content_quality'
        ]
      },
      name: String,
      description: String,
      progress: Number,
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date
    }]
  },
  contributions: {
    wondersAdded: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wonder'
    }],
    edits: [{
      wonder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wonder'
      },
      revision: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WonderRevision'
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    photos: [{
      wonder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wonder'
      },
      url: String,
      approvedAt: Date
    }],
    reviews: [{
      wonder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wonder'
      },
      rating: Number,
      text: String,
      helpfulVotes: Number,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // Edit privileges
  editPrivileges: {
    type: String,
    enum: [
      'none',              // Can only suggest edits
      'minor_edits',       // Can make minor edits
      'full_edits',        // Can make major edits
      'trusted_editor',    // Can make all edits and review others
      'moderator'          // Full moderation rights
    ],
    default: 'none'
  },
  // Specialized permissions
  permissions: {
    canVerifyContent: {
      type: Boolean,
      default: false
    },
    canModerateDiscussions: {
      type: Boolean,
      default: false
    },
    canReviewEdits: {
      type: Boolean,
      default: false
    },
    canProtectLocations: {
      type: Boolean,
      default: false
    }
  },
  // Areas of expertise
  expertise: [{
    region: String,
    category: String,
    level: {
      type: Number,
      min: 1,
      max: 5
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Activity tracking
  lastActive: {
    type: Date,
    default: Date.now
  },
  activityStreak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastActivityDate: Date
  },
  // User preferences
  preferences: {
    emailNotifications: {
      editApproved: {
        type: Boolean,
        default: true
      },
      editRejected: {
        type: Boolean,
        default: true
      },
      newDiscussion: {
        type: Boolean,
        default: true
      },
      achievementEarned: {
        type: Boolean,
        default: true
      }
    },
    displayPreferences: {
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'dark'
      },
      language: {
        type: String,
        default: 'en'
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

// Virtual field for wonders count
userSchema.virtual('wondersCount', {
  ref: 'Wonder',
  localField: '_id',
  foreignField: 'createdBy',
  count: true
});

// Virtual field for total contributions
userSchema.virtual('totalContributions').get(function() {
  return (
    (this.contributions.wondersAdded?.length || 0) +
    (this.contributions.edits?.length || 0) +
    (this.contributions.photos?.length || 0) +
    (this.contributions.reviews?.length || 0)
  );
});

// Virtual field for reputation score
userSchema.virtual('reputationScore').get(function() {
  return UserReputation.findOne({ user: this._id }).select('trustScore');
});

// Update activity streak
userSchema.methods.updateActivityStreak = async function() {
  const now = new Date();
  const lastDate = this.activityStreak.lastActivityDate;

  if (!lastDate) {
    this.activityStreak.current = 1;
  } else {
    const daysSinceLastActivity = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastActivity === 1) {
      // Consecutive day
      this.activityStreak.current += 1;
      this.activityStreak.longest = Math.max(this.activityStreak.current, this.activityStreak.longest);
    } else if (daysSinceLastActivity > 1) {
      // Streak broken
      this.activityStreak.current = 1;
    }
  }

  this.activityStreak.lastActivityDate = now;
  await this.save();
};

// Check if user can perform specific actions
userSchema.methods.canEdit = function() {
  const trustedRoles = ['WonderGuide', 'RegionalCurator', 'ContentModerator', 'admin', 'superadmin'];
  return trustedRoles.includes(this.role) || this.reputation.points >= 100;
};

userSchema.methods.canModerate = function() {
  const moderatorRoles = ['ContentModerator', 'admin', 'superadmin'];
  return moderatorRoles.includes(this.role);
};

userSchema.methods.canApproveEdits = function() {
  const approverRoles = ['WonderGuide', 'RegionalCurator', 'ContentModerator', 'admin', 'superadmin'];
  return approverRoles.includes(this.role) || this.reputation.points >= 500;
};

userSchema.methods.canReviewEdits = function() {
  return this.permissions.canReviewEdits || this.canModerate();
};

// Indexes for efficient queries
userSchema.index({ 'reputation.points': -1 });
userSchema.index({ role: 1 });
userSchema.index({ 'expertise.region': 1 });
userSchema.index({ 'expertise.category': 1 });
userSchema.index({ lastActive: -1 });

// Methods for reputation management
userSchema.methods.addReputationPoints = function(points, reason) {
  this.reputation.points += points;
  
  // Check for level up
  const newLevel = Math.floor(Math.sqrt(this.reputation.points / 100)) + 1;
  if (newLevel > this.reputation.level) {
    this.reputation.level = newLevel;
  }

  return this.save();
};

userSchema.methods.awardBadge = function(badgeType, name, description) {
  this.reputation.badges.push({
    type: badgeType,
    name,
    description
  });
  return this.save();
};

userSchema.methods.updateAchievement = function(achievementType, progress) {
  const achievement = this.reputation.achievements.find(a => a.type === achievementType);
  if (achievement) {
    achievement.progress = progress;
    if (progress >= 100 && !achievement.completed) {
      achievement.completed = true;
      achievement.completedAt = new Date();
    }
  } else {
    this.reputation.achievements.push({
      type: achievementType,
      progress,
      completed: progress >= 100,
      completedAt: progress >= 100 ? new Date() : undefined
    });
  }
  return this.save();
};

// Update lastActive timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 