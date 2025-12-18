import Mentor from '../models/mentor.models.js';

// Get all mentors
export const listMentors = async (req, res) => {
  try {
    const { search, expertise, experience, page = 1, limit = 12 } = req.query;
    
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { expertise: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (expertise) {
      query.expertise = { $in: [expertise] };
    }
    
    if (experience) {
      query['experience.years'] = { $gte: parseInt(experience) };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const mentors = await Mentor.find(query)
      .populate('user', 'name email')
      .sort({ 'stats.rating': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Mentor.countDocuments(query);
    
    res.json({
      mentors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('❌ Error in listMentors:', err);
    res.status(500).json({ message: 'Error fetching mentors', error: err.message });
  }
};

// Get single mentor
export const getMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id)
      .populate('user', 'name email profile')
      .populate('availability.bookedBy', 'name email')
      .lean();
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    res.json(mentor);
  } catch (err) {
    console.error('❌ Error in getMentor:', err);
    res.status(500).json({ message: 'Error fetching mentor', error: err.message });
  }
};

// Create mentor
export const createMentor = async (req, res) => {
  try {
    const mentorData = {
      ...req.body,
      user: req.user._id
    };
    
    // Check if user already has a mentor profile
    const existingMentor = await Mentor.findOne({ user: req.user._id });
    if (existingMentor) {
      return res.status(400).json({ message: 'You already have a mentor profile' });
    }
    
    const mentor = await Mentor.create(mentorData);
    
    const populatedMentor = await Mentor.findById(mentor._id)
      .populate('user', 'name email')
      .lean();
    
    res.status(201).json(populatedMentor);
  } catch (err) {
    console.error('❌ Error in createMentor:', err);
    res.status(500).json({ message: 'Error creating mentor', error: err.message });
  }
};

// Update mentor
export const updateMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found or unauthorized' });
    }
    
    Object.assign(mentor, req.body);
    await mentor.save();
    
    const updatedMentor = await Mentor.findById(mentor._id)
      .populate('user', 'name email')
      .lean();
    
    res.json(updatedMentor);
  } catch (err) {
    console.error('❌ Error in updateMentor:', err);
    res.status(500).json({ message: 'Error updating mentor', error: err.message });
  }
};

// Book mentorship session
export const bookSession = async (req, res) => {
  try {
    const { slotId } = req.body;
    
    const mentor = await Mentor.findById(req.params.id);
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    const slot = mentor.availability.id(slotId);
    
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Slot already booked' });
    }
    
    slot.isBooked = true;
    slot.bookedBy = req.user._id;
    
    mentor.stats.totalSessions += 1;
    await mentor.save();
    
    res.json({ message: 'Session booked successfully', mentor });
  } catch (err) {
    console.error('❌ Error in bookSession:', err);
    res.status(500).json({ message: 'Error booking session', error: err.message });
  }
};

// Get mentor stats
export const getMentorStats = async (req, res) => {
  try {
    const stats = await Mentor.aggregate([
      {
        $group: {
          _id: null,
          totalMentors: { $sum: 1 },
          totalSessions: { $sum: '$stats.totalSessions' },
          avgRating: { $avg: '$stats.rating' }
        }
      }
    ]);
    
    res.json(stats[0] || { totalMentors: 0, totalSessions: 0, avgRating: 0 });
  } catch (err) {
    console.error('❌ Error in getMentorStats:', err);
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
};