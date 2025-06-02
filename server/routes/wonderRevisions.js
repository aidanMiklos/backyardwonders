const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WonderRevision = require('../models/WonderRevision');
const Wonder = require('../models/Wonder');
const User = require('../models/User');
const ReputationEvent = require('../models/ReputationEvent');

// Get all revisions for a wonder
router.get('/wonders/:wonderId/revisions', auth, async (req, res) => {
  try {
    const revisions = await WonderRevision.find({ wonder: req.params.wonderId })
      .populate('editor', 'displayName picture')
      .populate('comments.user', 'displayName picture')
      .sort('-createdAt');
    res.json(revisions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching revisions' });
  }
});

// Submit a new revision
router.post('/wonders/:wonderId/edit', auth, async (req, res) => {
  try {
    const wonder = await Wonder.findById(req.params.wonderId);
    if (!wonder) {
      return res.status(404).json({ message: 'Wonder not found' });
    }

    const user = await User.findById(req.user.id);
    const canEditDirectly = user.editPrivileges !== 'none';

    const revision = new WonderRevision({
      wonder: wonder._id,
      editor: req.user.id,
      section: req.body.section,
      changes: {
        previous: req.body.previousContent,
        current: req.body.content
      },
      status: canEditDirectly ? 'approved' : 'pending'
    });

    await revision.save();

    if (canEditDirectly) {
      // Update wonder content directly
      wonder.content[req.body.section] = {
        text: req.body.content,
        lastEditedBy: req.user.id,
        lastEditedAt: new Date()
      };
      await wonder.save();

      // Create reputation event
      await ReputationEvent.createEvent({
        user: req.user.id,
        type: 'edit_approved',
        points: 10,
        wonder: wonder._id,
        revision: revision._id,
        description: 'Direct edit approved'
      });
    }

    res.json(revision);
  } catch (err) {
    res.status(500).json({ message: 'Error submitting edit' });
  }
});

// Approve a revision
router.post('/wonders/:wonderId/revisions/:revisionId/approve', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.canApproveEdits()) {
      return res.status(403).json({ message: 'Not authorized to approve edits' });
    }

    const revision = await WonderRevision.findById(req.params.revisionId);
    if (!revision) {
      return res.status(404).json({ message: 'Revision not found' });
    }

    const wonder = await Wonder.findById(req.params.wonderId);
    if (!wonder) {
      return res.status(404).json({ message: 'Wonder not found' });
    }

    revision.status = 'approved';
    revision.approvedBy = req.user.id;
    revision.approvedAt = new Date();
    await revision.save();

    // Update wonder content
    wonder.content[revision.section] = {
      text: revision.changes.current,
      lastEditedBy: revision.editor,
      lastEditedAt: new Date()
    };
    await wonder.save();

    // Create reputation event
    await ReputationEvent.createEvent({
      user: revision.editor,
      type: 'edit_approved',
      points: 10,
      wonder: wonder._id,
      revision: revision._id,
      description: 'Edit suggestion approved'
    });

    res.json(revision);
  } catch (err) {
    res.status(500).json({ message: 'Error approving revision' });
  }
});

// Reject a revision
router.post('/wonders/:wonderId/revisions/:revisionId/reject', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.canApproveEdits()) {
      return res.status(403).json({ message: 'Not authorized to reject edits' });
    }

    const revision = await WonderRevision.findById(req.params.revisionId);
    if (!revision) {
      return res.status(404).json({ message: 'Revision not found' });
    }

    revision.status = 'rejected';
    revision.rejectedBy = req.user.id;
    revision.rejectedAt = new Date();
    revision.rejectionReason = req.body.reason;
    await revision.save();

    res.json(revision);
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting revision' });
  }
});

// Add a comment to a revision
router.post('/wonders/:wonderId/revisions/:revisionId/comments', auth, async (req, res) => {
  try {
    const revision = await WonderRevision.findById(req.params.revisionId);
    if (!revision) {
      return res.status(404).json({ message: 'Revision not found' });
    }

    revision.comments.push({
      user: req.user.id,
      text: req.body.comment
    });
    await revision.save();

    const populatedRevision = await WonderRevision.findById(revision._id)
      .populate('comments.user', 'displayName picture');

    res.json(populatedRevision.comments[populatedRevision.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment' });
  }
});

module.exports = router; 