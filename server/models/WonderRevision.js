const mongoose = require('mongoose');

const wonderRevisionSchema = new mongoose.Schema({
  wonder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wonder',
    required: true
  },
  editor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  section: {
    type: String,
    required: true
  },
  changes: {
    previous: {
      type: String,
      required: true
    },
    current: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,
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
  }]
}, {
  timestamps: true
});

// Indexes
wonderRevisionSchema.index({ wonder: 1, status: 1 });
wonderRevisionSchema.index({ editor: 1 });
wonderRevisionSchema.index({ createdAt: -1 });

// Virtual for comment count
wonderRevisionSchema.virtual('commentCount').get(function() {
  return this.comments?.length || 0;
});

const WonderRevision = mongoose.model('WonderRevision', wonderRevisionSchema);

module.exports = WonderRevision; 