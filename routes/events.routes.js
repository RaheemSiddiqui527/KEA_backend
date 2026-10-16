import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
  createEvent,
  listEvents,
  getEvent,
  registerForEvent,
  unregisterFromEvent,
  getCalendarEvents,
  getUserEvents,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration
} from '../controllers/events.controller.js';

const router = express.Router();

// Member-only routes (events are visible only to logged-in members)
router.get('/', auth, listEvents);
router.get('/calendar', auth, getCalendarEvents);
router.get('/user/my-events', auth, getUserEvents);
router.get('/:id', auth, getEvent);

// Protected routes
router.post('/', auth, createEvent);
router.post('/:id/register', auth, registerForEvent);
router.post('/:id/unregister', auth, unregisterFromEvent);

// Registration management
router.get('/:id/requests', auth, getPendingRegistrations);
router.post('/:id/requests/:userId/approve', auth, approveRegistration);
router.post('/:id/requests/:userId/reject', auth, rejectRegistration);

export default router;