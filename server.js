import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import errorHandler from './middleware/error.middleware.js';

import notificationRoutes from './routes/notification.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import usersRoutes from './routes/users.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import blogsRoutes from './routes/blogs.routes.js';
import eventsRoutes from './routes/events.routes.js';
import forumsRoutes from './routes/forums.routes.js';
import groupsRoutes from './routes/groups.routes.js';
import mentorsRoutes from './routes/mentors.routes.js';
import resourceRoutes from './routes/resources.routes.js';
import toolRoutes from './routes/tool.routes.js';
import SeminarRoutes from './routes/seminar.routes.js';
import galleryRoutes from './routes/gallery.routes.js';
import userSettingsRoutes from './routes/userSettings.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';


dotenv.config();

const app = express();
app.use(cors(
  "http://localhost:3000",
  "http://localhost:3001"
));
// app.use(cors({
  //   origin: process.env.FRONTEND_URL || 'http://localhost:3000'|| 'http://localhost:3001 ',
  //   credentials: true
  // }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  connectDB(process.env.MONGO_URI);
  
  // static uploads
  app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));
  
  // routes
  app.use('/api/auth', authRoutes);
  
  // Add this with your other routes
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/blogs', blogsRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/forums', forumsRoutes);
  app.use('/api/groups', groupsRoutes);
  app.use('/api/mentors', mentorsRoutes);
  app.use('/api/resources', resourceRoutes);
  app.use('/api/gallery', galleryRoutes);
  app.use('/api/tools', toolRoutes);
  app.use('/api/seminars', SeminarRoutes);
  app.use('/api/settings/user', userSettingsRoutes);

app.use('/api/feedback', feedbackRoutes);
// health
app.get('/health', (req, res) => res.json({ ok: true }));

// error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
