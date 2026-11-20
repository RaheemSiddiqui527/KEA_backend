import { auth, isAdmin } from './auth.middleware.js';

export const adminAuth = [auth, isAdmin];
export default adminAuth;
