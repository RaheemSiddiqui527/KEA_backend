import Event from '../models/event.models.js';
import EventRegistration from '../models/EventRegistration.models.js';
import User from '../models/user.models.js'; // Needed to fetch user details for emails
import { createAdminNotification, createUserNotification } from '../utils/createNotification.js';
import { sendEventRegistrationEmail, sendEventApprovalEmail } from '../utils/emailService.js';

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

// Register for event (with approval system)
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
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

    // Check if already in pending list
    const isPending = event.pendingAttendees?.some(
      userId => userId.toString() === req.user._id.toString()
    );

    if (isPending) {
      return res.status(400).json({ message: 'Registration request already sent and pending approval' });
    }
    
    // Check max attendees
    if (event.maxAttendees && event.registeredUsers?.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }
    
    // Check registration deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // If approval is required
    if (event.requireApproval) {
      await Event.findByIdAndUpdate(req.params.id, {
        $push: { pendingAttendees: req.user._id }
      });

      // Notify Organizer
      await createUserNotification({
        userId: event.organizer,
        type: 'event_request',
        title: 'New Registration Request',
        message: `${req.user.name} wants to register for "${event.title}"`,
        relatedId: event._id,
        relatedModel: 'Event'
      });

      // 🎉 SEND EMAIL TO USER (Request Received)
      try {
        await sendEventRegistrationEmail(req.user.email, req.user.name, event.title);
      } catch (emailErr) {
        console.error('Error sending registration request email:', emailErr);
      }

      return res.json({ 
        message: 'Registration request sent! Waiting for organizer approval.',
        status: 'pending'
      });
    }
    
    // Direct registration
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        $push: { registeredUsers: req.user._id }
      },
      { 
        new: true,
        runValidators: false
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
      if (regError.code !== 11000) {
        console.error('Error creating registration record:', regError);
      }
    }
    
    res.json({ 
      message: 'Successfully registered for event', 
      event: updatedEvent,
      status: 'confirmed'
    });
  } catch (err) {
    console.error('❌ Error in registerForEvent:', err);
    res.status(500).json({ message: 'Error registering for event', error: err.message });
  }
};

// GET pending registrations
export const getPendingRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('pendingAttendees', 'name email profile')
      .lean();

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if requester is organizer
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to view registrations' });
    }

    res.json(event.pendingAttendees || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching registrations', error: err.message });
  }
};

// Approve registration
export const approveRegistration = async (req, res) => {
  try {
    const { userId } = req.params;
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to approve registrations' });
    }

    const pendingIndex = event.pendingAttendees.indexOf(userId);
    if (pendingIndex === -1) return res.status(404).json({ message: 'Registration request not found' });

    // Move to registered
    event.registeredUsers.push(userId);
    event.pendingAttendees.splice(pendingIndex, 1);
    await event.save();

    // Fetch user details for email
    const participant = await User.findById(userId);
    if (participant) {
      try {
        await sendEventApprovalEmail(participant.email, participant.name, event.title);
      } catch (emailErr) {
        console.error('Error sending event approval email:', emailErr);
      }
    }

    // Create registration record
    try {
      await EventRegistration.create({
        user: userId,
        event: event._id,
        status: 'confirmed'
      });
    } catch (regError) {
      if (regError.code !== 11000) console.error(regError);
    }

    // Notify user
    await createUserNotification({
      userId,
      type: 'event_approved',
      title: 'Registration Approved',
      message: `Your registration for "${event.title}" was approved!`,
      relatedId: event._id,
      relatedModel: 'Event'
    });

    res.json({ message: 'Registration approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error approving registration', error: err.message });
  }
};

// Reject registration
export const rejectRegistration = async (req, res) => {
  try {
    const { userId } = req.params;
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to reject registrations' });
    }

    const pendingIndex = event.pendingAttendees.indexOf(userId);
    if (pendingIndex === -1) return res.status(404).json({ message: 'Registration request not found' });

    event.pendingAttendees.splice(pendingIndex, 1);
    await event.save();

    // Notify user
    await createUserNotification({
      userId,
      type: 'event_rejected',
      title: 'Registration Rejected',
      message: `Your registration for "${event.title}" was rejected.`,
      relatedId: event._id,
      relatedModel: 'Event'
    });

    res.json({ message: 'Registration rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting registration', error: err.message });
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