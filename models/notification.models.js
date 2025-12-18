import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Recipient of the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Type of notification
  type: {
    type: String,
    enum: ['member', 'job', 'blog', 'event', 'system', 'success', 'info', 'warning', 'error'],
    required: true
  },
  
  // Notification title
  title: {
    type: String,
    required: true
  },
  
  // Notification message
  message: {
    type: String,
    required: true
  },
  
  // Reference to related entity
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  
  // Model name for the related entity
  relatedModel: {
    type: String,
    enum: ['User', 'Job', 'Blog', 'Event', null]
  },
  
  // Read status
  read: {
    type: Boolean,
    default: false
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return await this.save();
};

// Static method to create notification for all admins
notificationSchema.statics.createForAdmins = async function(notificationData) {
  const User = mongoose.model('User');
  const admins = await User.find({ role: 'admin' });
  
  const notifications = admins.map(admin => ({
    recipient: admin._id,
    ...notificationData
  }));
  
  return await this.insertMany(notifications);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipient: userId, read: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsReadForUser = async function(userId) {
  return await this.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );
};

export default mongoose.model('Notification', notificationSchema);