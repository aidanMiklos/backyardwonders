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
    enum: ['Backyard Beginner', 'Explorer', 'Trailblazer', 'WonderGuide', 'admin', 'superadmin'],
    default: 'Backyard Beginner'
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
  toObject: { virtuals: true }
});

// Virtual field for wonders count
userSchema.virtual('wondersCount', {
  ref: 'Wonder',
  localField: '_id',
  foreignField: 'createdBy',
  count: true
});

module.exports = mongoose.model('User', userSchema); 