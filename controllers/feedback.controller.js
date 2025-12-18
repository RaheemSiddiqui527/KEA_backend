import Feedback from '../models/feedback.models.js';
import { createAdminNotification } from '../utils/createNotification.js';

// Submit feedback
export const submitFeedback = async (req, res) => {
  try {
    const feedbackData = {
      ...req.body,
      user: req.user._id
    };
    
    const feedback = await Feedback.create(feedbackData);
    
    // Notify admins
    await createAdminNotification({
      type: 'feedback',
      title: 'New Feedback Received',
      message: `${feedback.category}: ${feedback.subject}`,
      relatedId: feedback._id,
      relatedModel: 'Feedback'
    });
    
    res.status(201).json({ 
      message: 'Feedback submitted successfully',
      feedback 
    });
  } catch (err) {
    console.error('❌ Error in submitFeedback:', err);
    res.status(500).json({ message: 'Error submitting feedback', error: err.message });
  }
};

// Get user's feedback history
export const getUserFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const feedbacks = await Feedback.find({ user: req.user._id })
      .populate('adminResponse.respondedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Feedback.countDocuments({ user: req.user._id });
    
    res.json({
      feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('❌ Error in getUserFeedback:', err);
    res.status(500).json({ message: 'Error fetching feedback', error: err.message });
  }
};

// Get single feedback
export const getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    })
    .populate('user', 'name email')
    .populate('adminResponse.respondedBy', 'name email')
    .lean();
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (err) {
    console.error('❌ Error in getFeedback:', err);
    res.status(500).json({ message: 'Error fetching feedback', error: err.message });
  }
};

// Delete feedback
export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found or unauthorized' });
    }
    
    await Feedback.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error('❌ Error in deleteFeedback:', err);
    res.status(500).json({ message: 'Error deleting feedback', error: err.message });
  }
};

// Get feedback stats
export const getFeedbackStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await Feedback.countDocuments({ user: req.user._id });
    
    const statusCounts = {
      total,
      pending: 0,
      'in-progress': 0,
      resolved: 0,
      closed: 0
    };
    
    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });
    
    res.json(statusCounts);
  } catch (err) {
    console.error('❌ Error in getFeedbackStats:', err);
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
};