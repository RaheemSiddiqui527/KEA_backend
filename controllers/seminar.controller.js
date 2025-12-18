import Seminar from '../models/seminar.models.js';

// Get all seminars
export const getAllSeminars = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [seminars, total] = await Promise.all([
      Seminar.find(query)
        .populate('attendees', 'name email')
        .sort({ date: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Seminar.countDocuments(query)
    ]);
    
    res.json({
      seminars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
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

// Create seminar
export const createSeminar = async (req, res, next) => {
  try {
    const seminarData = {
      ...req.body,
      addedBy: req.user._id
    };
    
    const seminar = await Seminar.create(seminarData);
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

// Register for seminar
export const registerForSeminar = async (req, res, next) => {
  try {
    const seminar = await Seminar.findById(req.params.id);
    
    if (!seminar) {
      return res.status(404).json({ message: 'Seminar not found' });
    }
    
    // Check if already registered
    if (seminar.attendees.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already registered for this seminar' });
    }
    
    // Check if full
    if (seminar.maxAttendees && seminar.attendees.length >= seminar.maxAttendees) {
      return res.status(400).json({ message: 'Seminar is full' });
    }
    
    // Check if registration deadline passed
    if (seminar.registrationDeadline && new Date() > new Date(seminar.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }
    
    seminar.attendees.push(req.user._id);
    await seminar.save();
    
    res.json({ message: 'Registration successful', seminar });
  } catch (error) {
    next(error);
  }
};

// Unregister from seminar
export const unregisterFromSeminar = async (req, res, next) => {
  try {
    const seminar = await Seminar.findById(req.params.id);
    
    if (!seminar) {
      return res.status(404).json({ message: 'Seminar not found' });
    }
    
    seminar.attendees = seminar.attendees.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await seminar.save();
    
    res.json({ message: 'Unregistered successfully' });
  } catch (error) {
    next(error);
  }
};

// Get category stats
export const getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Seminar.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const total = await Seminar.countDocuments();
    
    const categories = [
      { name: 'All', count: total },
      ...stats.map(s => ({ name: s._id, count: s.count }))
    ];
    
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};