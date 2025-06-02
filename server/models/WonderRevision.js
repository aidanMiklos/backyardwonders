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
  version: {
    type: Number,
    required: true
  },
  changes: {
    name: String,
    description: String,
    category: String,
    subcategory: String,
    country: String,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    },
    history: String,
    culturalSignificance: String,
    floraAndFauna: String,
    visitingInformation: String,
    safetyGuidelines: String,
    references: [{
      title: String,
      url: String,
      accessDate: Date
    }],
    photos: [{
      url: String,
      caption: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: Date
    }]
  },
  editSummary: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for wonder + version
wonderRevisionSchema.index({ wonder: 1, version: 1 }, { unique: true });

const WonderRevision = mongoose.model('WonderRevision', wonderRevisionSchema);

module.exports = WonderRevision; 