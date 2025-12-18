import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
  createEvent,
  listEvents,
  getEvent,
  registerForEvent,
  unregisterFromEvent,
  getCalendarEvents,
  getUserEvents
} from '../controllers/events.controller.js';

const router = express.Router();

// Public routes
router.get('/', listEvents);
router.get('/calendar', getCalendarEvents);
router.get('/:id', getEvent);

// Protected routes
router.post('/', auth, createEvent);
router.post('/:id/register', auth, registerForEvent);
router.post('/:id/unregister', auth, unregisterFromEvent);
router.get('/user/my-events', auth, getUserEvents);

export default router;