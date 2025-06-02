const express = require('express');
const router = express.Router();
const Wonder = require('../models/Wonder');
const WonderRevision = require('../models/WonderRevision');
const auth = require('../middleware/auth');
const { uploadImage } = require('../utils/storage');

// Get revision history for a wonder
router.get('/:wonderId/revisions', async (req, res) => {
  try {
    const revisions = await WonderRevision.find({ wonder: req.params.wonderId })
      .populate('editor', 'displayName picture')
      .sort('-version')
      .select('-changes'); // Exclude the full changes to reduce payload size

    res.json(revisions);
  } catch (err) {
    console.error('Error fetching revisions:', err);
    res.status(500).json({ message: 'Error fetching revision history' });
  }
});

// Get a specific revision
router.get('/:wonderId/revisions/:version', async (req, res) => {
  try {
    const revision = await WonderRevision.findOne({
      wonder: req.params.wonderId,
      version: req.params.version
    }).populate('editor', 'displayName picture');

    if (!revision) {
      return res.status(404).json({ message: 'Revision not found' });
    }

    res.json(revision);
  } catch (err) {
    console.error('Error fetching revision:', err);
    res.status(500).json({ message: 'Error fetching revision' });
  }
});

// Create a new revision
router.post('/:wonderId/revisions', auth, async (req, res) => {
  try {
    const wonder = await Wonder.findById(req.params.wonderId);
    if (!wonder) {
      return res.status(404).json({ message: 'Wonder not found' });
    }

    // Create new revision
    const newRevision = new WonderRevision({
      wonder: wonder._id,
      editor: req.user._id,
      version: wonder.currentVersion + 1,
      changes: req.body.changes,
      editSummary: req.body.editSummary
    });

    // Save revision
    await newRevision.save();

    // Update wonder with new changes
    Object.assign(wonder, req.body.changes);
    wonder.currentVersion = newRevision.version;
    wonder.lastEditedBy = req.user._id;
    wonder.updatedAt = Date.now();

    await wonder.save();
    await wonder.populate('lastEditedBy', 'displayName picture');

    res.json({
      wonder,
      revision: newRevision
    });
  } catch (err) {
    console.error('Error creating revision:', err);
    res.status(500).json({ message: 'Error creating revision' });
  }
});

// Compare two revisions
router.get('/:wonderId/revisions/compare', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const [fromRevision, toRevision] = await Promise.all([
      WonderRevision.findOne({
        wonder: req.params.wonderId,
        version: from
      }),
      WonderRevision.findOne({
        wonder: req.params.wonderId,
        version: to
      })
    ]);

    if (!fromRevision || !toRevision) {
      return res.status(404).json({ message: 'One or both revisions not found' });
    }

    // Create a diff of the changes
    const diff = {
      name: fromRevision.changes.name !== toRevision.changes.name,
      description: fromRevision.changes.description !== toRevision.changes.description,
      category: fromRevision.changes.category !== toRevision.changes.category,
      subcategory: fromRevision.changes.subcategory !== toRevision.changes.subcategory,
      country: fromRevision.changes.country !== toRevision.changes.country,
      location: JSON.stringify(fromRevision.changes.location) !== JSON.stringify(toRevision.changes.location),
      history: fromRevision.changes.history !== toRevision.changes.history,
      culturalSignificance: fromRevision.changes.culturalSignificance !== toRevision.changes.culturalSignificance,
      floraAndFauna: fromRevision.changes.floraAndFauna !== toRevision.changes.floraAndFauna,
      visitingInformation: fromRevision.changes.visitingInformation !== toRevision.changes.visitingInformation,
      safetyGuidelines: fromRevision.changes.safetyGuidelines !== toRevision.changes.safetyGuidelines,
      references: JSON.stringify(fromRevision.changes.references) !== JSON.stringify(toRevision.changes.references),
      photos: JSON.stringify(fromRevision.changes.photos) !== JSON.stringify(toRevision.changes.photos)
    };

    res.json({
      fromRevision,
      toRevision,
      diff
    });
  } catch (err) {
    console.error('Error comparing revisions:', err);
    res.status(500).json({ message: 'Error comparing revisions' });
  }
});

// Revert to a specific revision
router.post('/:wonderId/revisions/:version/revert', auth, async (req, res) => {
  try {
    const wonder = await Wonder.findById(req.params.wonderId);
    if (!wonder) {
      return res.status(404).json({ message: 'Wonder not found' });
    }

    const targetRevision = await WonderRevision.findOne({
      wonder: req.params.wonderId,
      version: req.params.version
    });

    if (!targetRevision) {
      return res.status(404).json({ message: 'Target revision not found' });
    }

    // Create new revision with reverted changes
    const newRevision = new WonderRevision({
      wonder: wonder._id,
      editor: req.user._id,
      version: wonder.currentVersion + 1,
      changes: targetRevision.changes,
      editSummary: `Reverted to version ${req.params.version}`
    });

    await newRevision.save();

    // Update wonder with reverted changes
    Object.assign(wonder, targetRevision.changes);
    wonder.currentVersion = newRevision.version;
    wonder.lastEditedBy = req.user._id;
    wonder.updatedAt = Date.now();

    await wonder.save();
    await wonder.populate('lastEditedBy', 'displayName picture');

    res.json({
      wonder,
      revision: newRevision
    });
  } catch (err) {
    console.error('Error reverting revision:', err);
    res.status(500).json({ message: 'Error reverting to revision' });
  }
});

module.exports = router; 