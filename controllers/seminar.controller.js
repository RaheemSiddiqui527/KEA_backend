import mongoose from 'mongoose';
import Seminar from '../models/seminar.models.js';

// Get all seminars (with filters + pagination)
export const getAllSeminars = async (req, res, next) => {
  try {
    const {
      category,
      status,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Category filter (case-insensitive "all")
    if (category && category.toLowerCase() !== 'all') {
      query.category = category;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search (text index OR regex fallback)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [seminars, total] = await Promise.all([
      Seminar.find(query)
        .populate('attendees', 'name email')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limitNum),
      Seminar.countDocuments(query)
    ]);

    res.json({
      seminars,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get seminar by ID
export const getSeminarById = async (req, res, next) => {
  try {
    const seminar = await Seminar.findById(req.params.id)
      .populate('attendees', 'name email profile')
      .populate('addedBy', 'name email');

    if (!seminar) {
      return res.status(404).json({ message: 'Seminar not found' });
    }

    res.json(seminar);
  } catch (error) {
    next(error);
  }
};

// Create seminar (admin)
export const createSeminar = async (req, res, next) => {
  try {
    const seminar = await Seminar.create({
      ...req.body,
      addedBy: req.user._id
    });

    res.status(201).json(seminar);
  } catch (error) {
    next(error);
  }
};

// Update seminar
export const updateSeminar = async (req, res, next) => {
  try {
    const seminar = await Seminar.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!seminar) {
      return res.status(404).json({ message: 'Seminar not found' });
    }

    res.json(seminar);
  } catch (error) {
    next(error);
  }
};

// Delete seminar
export const deleteSeminar = async (req, res, next) => {
  try {
    const seminar = await Seminar.findByIdAndDelete(req.params.id);

    if (!seminar) {
      return res.status(404).json({ message: 'Seminar not found' });
    }

    res.json({ message: 'Seminar deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Bulk delete seminars (NEW)
export const bulkDeleteSeminars = async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty seminar IDs array' });
    }

    // Validate all IDs are valid MongoDB ObjectIds
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({ message: 'No valid seminar IDs provided' });
    }

    const result = await Seminar.deleteMany({ _id: { $in: validIds } });
    
    res.json({ 
      message: `${result.deletedCount} seminar(s) deleted successfully`,
      deletedCount: result.deletedCount,
      requestedCount: ids.length
    });
  } catch (error) {
    next(error);
  }
};

// Register for seminar (ATOMIC) - FIXED
export const registerForSeminar = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const seminarId = req.params.id;

    // Fixed: Properly combine multiple $or conditions using $and
    const seminar = await Seminar.findOneAndUpdate(
      {
        _id: seminarId,
        attendees: { $ne: userId },
        $and: [
          {
            $or: [
              { maxAttendees: { $exists: false } },
              { $expr: { $lt: [{ $size: '$attendees' }, '$maxAttendees'] } }
            ]
          },
          {
            $or: [
              { registrationDeadline: { $exists: false } },
              { registrationDeadline: { $gte: new Date() } }
            ]
          }
        ]
      },
      { $addToSet: { attendees: userId } },
      { new: true }
    ).populate('attendees', 'name email');

    if (!seminar) {
      return res.status(400).json({
        message: 'Cannot register: seminar is full, registration deadline has passed, or you are already registered'
      });
    }

    res.json({ 
      message: 'Registration successful', 
      seminar 
    });
  } catch (error) {
    next(error);
  }
};

// Unregister from seminar - FIXED
export const unregisterFromSeminar = async (req, res, next) => {
  try {
    const seminar = await Seminar.findByIdAndUpdate(
      req.params.id,
      { $pull: { attendees: req.user._id } },
      { new: true }
    ).populate('attendees', 'name email');

    if (!seminar) {
      return res.status(404).json({ message: 'Seminar not found' });
    }

    res.json({ 
      message: 'Unregistered successfully',
      seminar 
    });
  } catch (error) {
    next(error);
  }
};

// Get category stats
export const getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Seminar.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = await Seminar.countDocuments();

    res.json({
      categories: [
        { name: 'All', count: total },
        ...stats.map(s => ({ name: s._id, count: s.count }))
      ]
    });
  } catch (error) {
    next(error);
  }
};

// Get stats (NEW - Optimized)
export const getStats = async (req, res, next) => {
  try {
    const stats = await Seminar.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]
        }
      }
    ]);
    
    const total = stats[0]?.total[0]?.count || 0;
    const statusCounts = (stats[0]?.byStatus || []).reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      total,
      upcoming: statusCounts.upcoming || 0,
      ongoing: statusCounts.ongoing || 0,
      completed: statusCounts.completed || 0,
      cancelled: statusCounts.cancelled || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    next(error);
  }
};