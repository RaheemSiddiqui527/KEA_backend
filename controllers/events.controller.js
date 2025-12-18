import Event from '../models/event.models.js';
import EventRegistration from '../models/eventRegistration.models.js';
import { createAdminNotification } from '../utils/createNotification.js';

// Create event
export const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id,
      status: 'pending'
    };
    
    const event = await Event.create(eventData);
    
    // Notify admins
    await createAdminNotification({
      type: 'event',
      title: 'New Event Submission',
      message: `${event.title} is pending approval`,
      relatedId: event._id,
      relatedModel: 'Event'
    });
    
    res.status(201).json(event);
  } catch (err) {
    console.error('❌ Error in createEvent:', err);
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
};

// List events
export const listEvents = async (req, res) => {
  try {
    const { search, eventType, month, year, page = 1, limit = 20 } = req.query;
    
    const query = { status: 'approved' };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (month && year) {
      const startOfMonth = new Date(parseInt(year), parseInt(month), 1);
      const endOfMonth = new Date(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59);
      query.startDate = { $gte: startOfMonth, $lte: endOfMonth };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Event.countDocuments(query);
    
    // Add registration count
    const eventsWithCount = events.map(event => ({
      ...event,
      registeredCount: event.registeredUsers?.length || 0
    }));
    
    res.json({
      events: eventsWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('❌ Error in listEvents:', err);
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
};

// Get single event
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email profile')
      .populate('registeredUsers', 'name email')
      .lean();
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (err) {
    console.error('❌ Error in getEvent:', err);
    res.status(500).json({ message: 'Error fetching event', error: err.message });
  }
};

// Register for event - FIXED
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Event is not open for registration' });
    }
    
    // Check if already registered
    const alreadyRegistered = event.registeredUsers?.some(
      userId => userId.toString() === req.user._id.toString()
    );
    
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }
    
    // Check max attendees
    if (event.maxAttendees && event.registeredUsers?.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }
    
    // Check registration deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }
    
    // Use findByIdAndUpdate to avoid validation issues
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        $push: { registeredUsers: req.user._id }
      },
      { 
        new: true,
        runValidators: false  // Skip validation on update
      }
    )
    .populate('organizer', 'name email')
    .populate('registeredUsers', 'name email')
    .lean();
    
    // Create registration record
    try {
      await EventRegistration.create({
        user: req.user._id,
        event: event._id,
        status: 'confirmed'
      });
    } catch (regError) {
      // Ignore duplicate registration errors
      if (regError.code !== 11000) {
        console.error('Error creating registration record:', regError);
      }
    }
    
    res.json({ message: 'Successfully registered for event', event: updatedEvent });
  } catch (err) {
    console.error('❌ Error in registerForEvent:', err);
    res.status(500).json({ message: 'Error registering for event', error: err.message });
  }
};

// Unregister from event - FIXED
export const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Use findByIdAndUpdate to avoid validation issues
    await Event.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { registeredUsers: req.user._id }
      },
      { 
        runValidators: false  // Skip validation on update
      }
    );
    
    // Update registration record
    await EventRegistration.findOneAndUpdate(
      { user: req.user._id, event: event._id },
      { status: 'cancelled' }
    );
    
    res.json({ message: 'Successfully unregistered from event' });
  } catch (err) {
    console.error('❌ Error in unregisterFromEvent:', err);
    res.status(500).json({ message: 'Error unregistering from event', error: err.message });
  }
};

// Get calendar events
export const getCalendarEvents = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const startOfMonth = new Date(parseInt(year), parseInt(month), 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59);
    
    const events = await Event.find({
      status: 'approved',
      startDate: { $gte: startOfMonth, $lte: endOfMonth }
    })
    .select('title startDate endDate eventType')
    .lean();
    
    res.json(events);
  } catch (err) {
    console.error('❌ Error in getCalendarEvents:', err);
    res.status(500).json({ message: 'Error fetching calendar events', error: err.message });
  }
};

// Get user's registered events
export const getUserEvents = async (req, res) => {
  try {
    const registrations = await EventRegistration.find({
      user: req.user._id,
      status: 'confirmed'
    })
    .populate('event')
    .lean();
    
    const events = registrations.map(reg => reg.event).filter(Boolean);
    
    res.json(events);
  } catch (err) {
    console.error('❌ Error in getUserEvents:', err);
    res.status(500).json({ message: 'Error fetching user events', error: err.message });
  }
};