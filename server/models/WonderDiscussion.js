const mongoose = require('mongoose');

const wonderDiscussionSchema = new mongoose.Schema({
  wonder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wonder',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['general', 'edit_proposal', 'content_issue', 'fact_check'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'archived'],
    default: 'open'
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  votes: {
    up: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    down: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionSummary: String,
  linkedRevision: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WonderRevision'
  }
}, {
  timestamps: true
});

// Indexes
wonderDiscussionSchema.index({ wonder: 1, type: 1 });
wonderDiscussionSchema.index({ wonder: 1, status: 1 });
wonderDiscussionSchema.index({ creator: 1 });
wonderDiscussionSchema.index({ createdAt: -1 });

// Virtual for vote count
wonderDiscussionSchema.virtual('voteCount').get(function() {
  return (this.votes.up?.length || 0) - (this.votes.down?.length || 0);
});

// Virtual for comment count
wonderDiscussionSchema.virtual('commentCount').get(function() {
  return this.comments?.length || 0;
});

// Methods
wonderDiscussionSchema.methods.addComment = function(userId, text) {
  this.comments.push({
    user: userId,
    text: text
  });
  return this.save();
};

wonderDiscussionSchema.methods.vote = function(userId, voteType) {
  // Remove existing votes by this user
  this.votes.up = this.votes.up.filter(id => !id.equals(userId));
  this.votes.down = this.votes.down.filter(id => !id.equals(userId));

  // Add new vote
  if (voteType === 'up') {
    this.votes.up.push(userId);
  } else if (voteType === 'down') {
    this.votes.down.push(userId);
  }

  return this.save();
};

wonderDiscussionSchema.methods.resolve = function(userId, summary) {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolutionSummary = summary;
  return this.save();
};

wonderDiscussionSchema.methods.reopen = function() {
  this.status = 'open';
  this.resolvedBy = undefined;
  this.resolutionSummary = undefined;
  return this.save();
};

wonderDiscussionSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static methods
wonderDiscussionSchema.statics.findByWonder = function(wonderId) {
  return this.find({ wonder: wonderId })
    .sort('-createdAt')
    .populate('creator', 'displayName picture')
    .populate('comments.user', 'displayName picture');
};

wonderDiscussionSchema.statics.findOpenByWonder = function(wonderId) {
  return this.find({ 
    wonder: wonderId,
    status: 'open'
  })
    .sort('-createdAt')
    .populate('creator', 'displayName picture')
    .populate('comments.user', 'displayName picture');
};

wonderDiscussionSchema.statics.findByType = function(wonderId, type) {
  return this.find({ 
    wonder: wonderId,
    type: type
  })
    .sort('-createdAt')
    .populate('creator', 'displayName picture')
    .populate('comments.user', 'displayName picture');
};

const WonderDiscussion = mongoose.model('WonderDiscussion', wonderDiscussionSchema);

module.exports = WonderDiscussion; 