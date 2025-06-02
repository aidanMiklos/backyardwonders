const mongoose = require('mongoose');

const reputationEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'edit_approved',
      'edit_rejected',
      'wonder_added',
      'photo_approved',
      'helpful_review',
      'quality_contribution',
      'achievement_earned',
      'badge_awarded',
      'level_up',
      'edit_streak',
      'moderation_action'
    ],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  wonder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wonder'
  },
  revision: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WonderRevision'
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    achievementType: String,
    badgeType: String,
    streakCount: Number,
    moderationAction: String,
    qualityScore: Number
  }
}, {
  timestamps: true
});

// Indexes
reputationEventSchema.index({ user: 1, createdAt: -1 });
reputationEventSchema.index({ type: 1, createdAt: -1 });
reputationEventSchema.index({ wonder: 1 });

// Static methods
reputationEventSchema.statics.createEvent = async function(eventData) {
  const event = new this(eventData);
  await event.save();

  // Update user's reputation
  const user = await mongoose.model('User').findById(event.user);
  await user.addReputationPoints(event.points, event.type);

  // Check for achievements based on event type
  switch (event.type) {
    case 'edit_approved':
      await this.checkEditAchievements(user);
      break;
    case 'wonder_added':
      await this.checkContributionAchievements(user);
      break;
    case 'photo_approved':
      await this.checkPhotoAchievements(user);
      break;
    case 'helpful_review':
      await this.checkReviewAchievements(user);
      break;
    case 'edit_streak':
      await this.checkStreakAchievements(user, event.metadata.streakCount);
      break;
  }

  return event;
};

reputationEventSchema.statics.checkEditAchievements = async function(user) {
  const editCount = await this.countDocuments({
    user: user._id,
    type: 'edit_approved'
  });

  const milestones = [1, 10, 50, 100, 500];
  for (const milestone of milestones) {
    if (editCount === milestone) {
      await user.awardBadge('editor', 
        `${milestone} Edits`,
        `Made ${milestone} successful edits`
      );
      break;
    }
  }
};

reputationEventSchema.statics.checkContributionAchievements = async function(user) {
  const wonderCount = await this.countDocuments({
    user: user._id,
    type: 'wonder_added'
  });

  const milestones = [1, 5, 25, 100];
  for (const milestone of milestones) {
    if (wonderCount === milestone) {
      await user.awardBadge('contributor',
        `${milestone} Wonders`,
        `Added ${milestone} new wonders to the map`
      );
      break;
    }
  }
};

reputationEventSchema.statics.checkPhotoAchievements = async function(user) {
  const photoCount = await this.countDocuments({
    user: user._id,
    type: 'photo_approved'
  });

  const milestones = [1, 10, 50, 100];
  for (const milestone of milestones) {
    if (photoCount === milestone) {
      await user.awardBadge('photographer',
        `${milestone} Photos`,
        `Contributed ${milestone} approved photos`
      );
      break;
    }
  }
};

reputationEventSchema.statics.checkReviewAchievements = async function(user) {
  const reviewCount = await this.countDocuments({
    user: user._id,
    type: 'helpful_review'
  });

  const milestones = [1, 10, 50, 100];
  for (const milestone of milestones) {
    if (reviewCount === milestone) {
      await user.awardBadge('reviewer',
        `${milestone} Helpful Reviews`,
        `Wrote ${milestone} reviews that others found helpful`
      );
      break;
    }
  }
};

reputationEventSchema.statics.checkStreakAchievements = async function(user, streakCount) {
  const streakMilestones = [7, 30, 100, 365];
  for (const milestone of streakMilestones) {
    if (streakCount === milestone) {
      await user.awardBadge('editor',
        `${milestone} Day Streak`,
        `Made contributions for ${milestone} days in a row`
      );
      break;
    }
  }
};

// Instance methods
reputationEventSchema.methods.getNotificationMessage = function() {
  const messages = {
    edit_approved: 'Your edit was approved! +{points} points',
    wonder_added: 'You added a new wonder! +{points} points',
    photo_approved: 'Your photo was approved! +{points} points',
    helpful_review: 'Your review was marked as helpful! +{points} points',
    achievement_earned: 'You earned a new achievement! +{points} points',
    badge_awarded: 'You earned a new badge! +{points} points',
    level_up: 'You reached level {level}! +{points} points',
    edit_streak: '{streakCount} day edit streak! +{points} points',
    moderation_action: 'Moderation action: {action} +{points} points'
  };

  let message = messages[this.type] || 'You earned {points} reputation points';
  
  // Replace placeholders
  message = message.replace('{points}', this.points);
  if (this.metadata) {
    message = message.replace('{level}', this.metadata.level);
    message = message.replace('{streakCount}', this.metadata.streakCount);
    message = message.replace('{action}', this.metadata.moderationAction);
  }

  return message;
};

const ReputationEvent = mongoose.model('ReputationEvent', reputationEventSchema);

module.exports = ReputationEvent; 