import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { createJob, searchJobs, getJob } from '../controllers/jobs.controller.js';

const router = express.Router();

router.get('/', searchJobs); // public search
router.post('/', auth, createJob); // create (pending approval)
router.get('/:id', getJob);

export default router;
