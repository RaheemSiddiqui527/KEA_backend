import User from '../models/user.models.js';
import bcrypt from 'bcryptjs';

// Get user settings
export const getUserSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email phone profile settings');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('❌ Error in getUserSettings:', err);
    res.status(500).json({ message: 'Error fetching settings', error: err.message });
  }
};

// Update account settings
export const updateAccountSettings = async (req, res) => {
  try {
    const { name, email, phone, branch, city, discipline } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    
    if (!user.profile) user.profile = {};
    if (branch) user.profile.branch = branch;
    if (city) user.profile.city = city;
    if (discipline) user.profile.discipline = discipline;
    
    await user.save();
    
    res.json({ message: 'Account settings updated successfully', user });
  } catch (err) {
    console.error('❌ Error in updateAccountSettings:', err);
    res.status(500).json({ message: 'Error updating settings', error: err.message });
  }
};

// Update notification preferences
export const updateNotificationSettings = async (req, res) => {
  try {
    const { email, jobUpdates, eventReminders, newsletter, communityActivity } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'settings.notifications.email': email,
          'settings.notifications.jobUpdates': jobUpdates,
          'settings.notifications.eventReminders': eventReminders,
          'settings.notifications.newsletter': newsletter,
          'settings.notifications.communityActivity': communityActivity
        }
      },
      { new: true, runValidators: false }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Notification preferences updated successfully', settings: user.settings });
  } catch (err) {
    console.error('❌ Error in updateNotificationSettings:', err);
    res.status(500).json({ message: 'Error updating notifications', error: err.message });
  }
};

// Update privacy settings
export const updatePrivacySettings = async (req, res) => {
  try {
    const { profileVisibility, showEmail, showPhone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'settings.privacy.profileVisibility': profileVisibility,
          'settings.privacy.showEmail': showEmail,
          'settings.privacy.showPhone': showPhone
        }
      },
      { new: true, runValidators: false }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Privacy settings updated successfully', settings: user.settings });
  } catch (err) {
    console.error('❌ Error in updatePrivacySettings:', err);
    res.status(500).json({ message: 'Error updating privacy', error: err.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('❌ Error in changePassword:', err);
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }
    
    // Delete user
    await User.findByIdAndDelete(req.user._id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('❌ Error in deleteAccount:', err);
    res.status(500).json({ message: 'Error deleting account', error: err.message });
  }
};