import Subscriber from '../models/newsletter.models.js';
import NewsletterCampaign from '../models/newsletterCampaign.models.js';
import { sendWelcomeNewsletterEmail, sendBroadcastNewsletterEmail } from '../utils/emailService.js';

// Public Subscribe Endpoint
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Regex email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address format' });
    }

    // Check if subscriber exists
    const existing = await Subscriber.findOne({ email: cleanEmail });

    if (existing) {
      if (existing.status === 'active') {
        return res.status(400).json({ message: 'This email is already subscribed.' });
      } else {
        // Reactivate unsubscribed user
        existing.status = 'active';
        existing.subscribedAt = new Date();
        existing.unsubscribedAt = null;
        await existing.save();

        // Send welcome email asynchronously
        sendWelcomeNewsletterEmail(cleanEmail).catch(err => console.error('Welcome email error:', err));

        return res.status(200).json({ message: 'Thank you for subscribing to KEA updates!' });
      }
    }

    // Create new active subscriber
    const newSubscriber = await Subscriber.create({
      email: cleanEmail,
      status: 'active',
      subscribedAt: new Date()
    });

    // Send welcome email asynchronously via Resend
    sendWelcomeNewsletterEmail(cleanEmail).catch(err => console.error('Welcome email error:', err));

    return res.status(201).json({
      message: 'Thank you for subscribing to KEA updates!',
      subscriber: newSubscriber
    });

  } catch (err) {
    console.error('❌ Error in newsletter subscribe:', err);
    res.status(500).json({ message: 'An error occurred while subscribing. Please try again.' });
  }
};

// Public Unsubscribe Endpoint
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.query;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      await Subscriber.findOneAndUpdate(
        { email: cleanEmail },
        { status: 'unsubscribed', unsubscribedAt: new Date() }
      );
    }

    // Return friendly HTML page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Unsubscribed | KEA</title>
        <style>
          body { font-family: Arial, sans-serif; background: #0D2847; color: white; display: flex; items-center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
          .card { background: white; color: #1e293b; max-width: 450px; padding: 40px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); }
          h2 { color: #0D2847; margin-top: 0; }
          a { display: inline-block; margin-top: 20px; background: #f59e0b; color: #0D2847; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>You have been unsubscribed</h2>
          <p>You will no longer receive marketing emails from Kokani Engineers & Professionals Association (KEA).</p>
          <a href="/">Return to KEA Website</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error processing unsubscribe request.');
  }
};

// Admin: Get all subscribers with search & filter
export const getSubscribersAdmin = async (req, res) => {
  try {
    const { q, status, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (q) {
      filter.email = { $regex: q.trim(), $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subscribers, total] = await Promise.all([
      Subscriber.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Subscriber.countDocuments(filter)
    ]);

    const activeCount = await Subscriber.countDocuments({ status: 'active' });
    const unsubscribedCount = await Subscriber.countDocuments({ status: 'unsubscribed' });

    res.json({
      subscribers,
      stats: {
        totalSubscribers: total,
        activeCount,
        unsubscribedCount
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subscribers', error: err.message });
  }
};

// Admin: Toggle subscriber status (active <-> unsubscribed)
export const toggleSubscriberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    subscriber.status = subscriber.status === 'active' ? 'unsubscribed' : 'active';
    if (subscriber.status === 'unsubscribed') {
      subscriber.unsubscribedAt = new Date();
    } else {
      subscriber.unsubscribedAt = null;
    }

    await subscriber.save();
    res.json({ message: `Subscriber status updated to ${subscriber.status}`, subscriber });
  } catch (err) {
    res.status(500).json({ message: 'Error updating subscriber status', error: err.message });
  }
};

// Admin: Delete subscriber
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    await Subscriber.findByIdAndDelete(id);
    res.json({ message: 'Subscriber deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting subscriber', error: err.message });
  }
};

// Admin: Send Campaign Broadcast to All Active Subscribers
export const sendCampaignBroadcast = async (req, res) => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ message: 'Subject and email content are required' });
    }

    // Fetch all active subscribers
    const activeSubscribers = await Subscriber.find({ status: 'active' }).select('email');

    if (activeSubscribers.length === 0) {
      return res.status(400).json({ message: 'No active subscribers found to receive broadcast.' });
    }

    // Create campaign record
    const campaign = await NewsletterCampaign.create({
      subject,
      content,
      status: 'sent',
      sentAt: new Date(),
      recipientCount: activeSubscribers.length,
      createdBy: req.user?._id
    });

    // Send emails in batches using Resend
    const recipientEmails = activeSubscribers.map(s => s.email);
    
    // Asynchronously send broadcast emails
    Promise.allSettled(
      recipientEmails.map(email => sendBroadcastNewsletterEmail(email, subject, content))
    ).then(results => {
      const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      console.log(`📡 Broadcast Sent: ${successful}/${recipientEmails.length} delivered.`);
    });

    res.json({
      message: `Newsletter campaign broadcast initiated to ${activeSubscribers.length} active subscribers!`,
      campaign
    });

  } catch (err) {
    console.error('❌ Error sending campaign broadcast:', err);
    res.status(500).json({ message: 'Error broadcasting newsletter', error: err.message });
  }
};

// Admin: Send Test Campaign Email
export const sendTestCampaign = async (req, res) => {
  try {
    const { testEmail, subject, content } = req.body;
    const recipient = testEmail || req.user?.email || 'support@kokaniengineers.org';

    await sendBroadcastNewsletterEmail(
      recipient,
      `[TEST BROADCAST] ${subject || 'KEA Newsletter Preview'}`,
      content || '<p>This is a test newsletter content preview.</p>'
    );

    res.json({ message: `Test newsletter email sent to ${recipient}` });
  } catch (err) {
    res.status(500).json({ message: 'Error sending test campaign', error: err.message });
  }
};
