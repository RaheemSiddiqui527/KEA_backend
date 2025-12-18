import Notification from '../models/notification.models.js';
import User from '../models/user.models.js';

// Create notification for all admins (used when users register, submit content, etc.)
export const createAdminNotification = async ({
  type,
  title,
  message,
  relatedId,
  relatedModel,
  priority = 'medium',
  metadata
}) => {
  try {
    await Notification.createForAdmins({
      type,
      title,
      message,
      relatedId,
      relatedModel,
      priority,
      metadata
    });
  } catch (err) {
    console.error('Error creating admin notification:', err);
  }
};

// Create notification for specific user
export const createUserNotification = async ({
  userId,
  type,
  title,
  message,
  relatedId,
  relatedModel,
  priority = 'medium',
  metadata
}) => {
  try {
    await Notification.create({
      recipient: userId,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      priority,
      metadata
    });
  } catch (err) {
    console.error('Error creating user notification:', err);
  }
};

// Create notification for multiple users
export const createBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = userIds.map(userId => ({
      recipient: userId,
      ...notificationData
    }));
    
    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Error creating bulk notifications:', err);
  }
};

// Backward compatibility - createNotification calls createAdminNotification
export const createNotification = createAdminNotification;

export default {
  createNotification,
  createAdminNotification,
  createUserNotification,
  createBulkNotifications
};