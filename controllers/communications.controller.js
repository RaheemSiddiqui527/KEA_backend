import EmailLog from '../models/emailLog.models.js';
import User from '../models/user.models.js';
import Newsletter from '../models/newsletter.models.js';
import emailService from '../utils/emailService.js';

export const sendBulkEmail = async (req, res) => {
  try {
    const { subject, type, recipientGroup, htmlContent } = req.body;
    const adminId = req.user.id; // assuming auth middleware attaches admin to req.user

    let recipients = [];

    if (recipientGroup === 'All Subscribers') {
      const subscribers = await Newsletter.find({ status: 'active' });
      recipients = subscribers.map(s => s.email);
    } else if (recipientGroup === 'Active Users') {
      const users = await User.find({ status: 'Approved' });
      recipients = users.map(u => u.email);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid recipient group' });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipients found for the selected group' });
    }

    // Process in batches
    const BATCH_SIZE = 50;
    let failedCount = 0;
    
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const promises = batch.map(email => 
        emailService.sendBroadcastNewsletterEmail(email, subject, htmlContent)
      );
      const results = await Promise.allSettled(promises);
      
      results.forEach(result => {
        if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value?.success)) {
          failedCount++;
        }
      });
    }

    const newLog = await EmailLog.create({
      subject,
      type,
      sender: adminId,
      recipientGroup,
      recipientCount: recipients.length,
      failedCount,
      status: failedCount > 0 ? (failedCount === recipients.length ? 'Failed' : 'Partial') : 'Sent',
      content: htmlContent
    });

    res.status(200).json({
      success: true,
      message: 'Bulk email processing completed.',
      data: newLog
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({ success: false, message: 'Server error sending bulk email' });
  }
};

export const getEmailLogs = async (req, res) => {
  try {
    const logs = await EmailLog.find().sort({ createdAt: -1 }).populate('sender', 'name email');
    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching email logs' });
  }
};
