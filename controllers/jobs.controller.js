import Job from '../models/job.models.js';
import { paginate } from '../utils/paginate.js';
import { createAdminNotification } from '../utils/createNotification.js';

export const createJob = async (req, res, next) => {
  try {
    const job = await Job.create({ 
      ...req.body, 
      postedBy: req.user._id, 
      status: 'pending' 
    });
    
    // Create notification for admins
    await createAdminNotification({
      type: 'job',
      title: 'New Job Posting',
      message: `${job.title} position posted by ${job.company}`,
      relatedId: job._id,
      relatedModel: 'Job',
      priority: 'medium'
    });
    
    res.json(job);
  } catch (err) { 
    next(err); 
  }
};

export const searchJobs = async (req, res, next) => {
  try {
    const { q, location, type, page = 1, limit = 20 } = req.query;
    const filter = { status: 'approved' };
    
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (type) {
      filter.type = type;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('postedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Job.countDocuments(filter)
    ]);
    
    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) { 
    next(err); 
  }
};

export const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(job);
  } catch (err) { 
    next(err); 
  }
};