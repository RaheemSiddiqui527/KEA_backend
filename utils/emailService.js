// emailService.js
// Add this to your backend services folder

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter;

// Lazy initialization of transporter
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // your email password or app password
      },
    });

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        console.log('❌ Email Service Error:', error);
      } else {
        console.log('✅ Email Service is ready to send messages');
      }
    });
  }
  return transporter;
};

// Send registration confirmation email
export const sendRegistrationEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: '✅ KEA Registration Received - Pending Approval',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to KEA!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <p>Thank you for registering with the <strong>Kerala Engineers Association (KEA)</strong>!</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #14b8a6;">📋 Registration Status: PENDING APPROVAL</h3>
              <p>Your membership application has been received and is currently being reviewed by our administrators.</p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our admin team will review your application</li>
              <li>You'll receive an email notification once approved</li>
              <li>After approval, you can log in with full access</li>
            </ul>
            
            <p><strong>Your registered email:</strong> ${userEmail}</p>
            
            <div class="info-box" style="border-left-color: #3b82f6;">
              <p style="margin: 0;"><strong>💡 Pro Tip:</strong> Check your spam folder if you don't receive our approval email within 48-72 hours.</p>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br><strong>KEA Admin Team</strong></p>
          </div>
          <div class="footer">
            <p>Kerala Engineers Association © ${new Date().getFullYear()}</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log('Registration email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending registration email:', error);
    throw error;
  }
};

// Send approval email
export const sendApprovalEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: '🎉 KEA Membership Approved - Welcome Aboard!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .btn { display: inline-block; background: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎊 Congratulations ${userName}!</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <h2 style="margin-top: 0; color: #10b981;">✅ Your KEA Membership is APPROVED!</h2>
              <p>Your application has been reviewed and approved by our admin team.</p>
            </div>
            
            <p>Dear <strong>${userName}</strong>,</p>
            
            <p>Welcome to the Kerala Engineers Association! We're excited to have you as part of our community.</p>
            
            <p><strong>You can now:</strong></p>
            <ul>
              <li>✅ Log in to your account with full access</li>
              <li>✅ Search and connect with other KEA members</li>
              <li>✅ Access exclusive member resources</li>
              <li>✅ Participate in KEA events and networking</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://user.kea.nexcorealliance.com'}/login" class="btn">
                🚀 Login to Your Account
              </a>
            </div>
            
            <p><strong>Your login credentials:</strong></p>
            <ul>
              <li>Email: ${userEmail}</li>
              <li>Password: (the one you created during registration)</li>
            </ul>
            
            <p>Thank you for joining KEA. We look forward to your active participation!</p>
            
            <p>Best regards,<br><strong>KEA Admin Team</strong></p>
          </div>
          <div class="footer">
            <p>Kerala Engineers Association © ${new Date().getFullYear()}</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log('Approval email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
};

// Send rejection email
export const sendRejectionEmail = async (userEmail, userName, reason = '') => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'KEA Membership Application - Update Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KEA Membership Application</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <p>Thank you for your interest in joining the Kerala Engineers Association.</p>
            
            <div class="info-box">
              <p><strong>Application Status:</strong> Additional Information Required</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            
            <p>Unfortunately, we need some additional information or clarification before we can approve your membership.</p>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Please review your application details</li>
              <li>Contact our admin team for clarification</li>
              <li>You may reapply after addressing the concerns</li>
            </ul>
            
            <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br><strong>KEA Admin Team</strong></p>
          </div>
          <div class="footer">
            <p>Kerala Engineers Association © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log('Rejection email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw error;
  }
};

// =====================
// EVENT EMAILS
// =====================

export const sendEventRegistrationEmail = async (userEmail, userName, eventTitle) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `📋 Registration Received: ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #0d9488; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Event Registration</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your registration request for <strong>${eventTitle}</strong> has been received.</p>
          <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Status:</strong> Pending Approval</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">The organizer will review your request shortly.</p>
          </div>
          <p>You will receive another email once your registration is confirmed.</p>
          <p>Best regards,<br/>KEA Team</p>
        </div>
      </div>
    `
  };

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending event registration email:', error);
  }
};

export const sendEventApprovalEmail = async (userEmail, userName, eventTitle) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `✅ Registration Confirmed: ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #059669; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Registration Approved!</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Great news! Your registration for <strong>${eventTitle}</strong> has been <strong>APPROVED</strong>.</p>
          <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;">You are now officially registered for this event.</p>
          </div>
          <p>See you there!</p>
          <p>Best regards,<br/>KEA Team</p>
        </div>
      </div>
    `
  };

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending event approval email:', error);
  }
};

// =====================
// GROUP EMAILS
// =====================

export const sendGroupJoinRequestEmail = async (userEmail, userName, groupName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `📋 Join Request: ${groupName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #2563eb; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Group Join Request</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your request to join the group <strong>${groupName}</strong> has been submitted.</p>
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Status:</strong> Waiting for Admin Approval</p>
          </div>
          <p>We'll notify you once the group admin reviews your request.</p>
          <p>Best regards,<br/>KEA Team</p>
        </div>
      </div>
    `
  };

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending group join request email:', error);
  }
};

export const sendGroupApprovalEmail = async (userEmail, userName, groupName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `🎉 Welcome to ${groupName}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #1d4ed8; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Join Request Approved</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Welcome! Your request to join <strong>${groupName}</strong> has been <strong>APPROVED</strong>.</p>
          <div style="background: #eff6ff; border-left: 4px solid #1d4ed8; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;">You can now participate in discussions and view group content.</p>
          </div>
          <p>Happy networking!</p>
          <p>Best regards,<br/>KEA Team</p>
        </div>
      </div>
    `
  };
  try {
    await getTransporter().sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending group approval email:', error);
  }
};

export const sendAdminNotificationEmail = async (adminEmail, subject, title, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `🔔 Admin Alert: ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background: #1e293b; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Admin Notification</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">${title}</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #475569;">${message}</p>
          <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <a href="${process.env.ADMIN_URL || 'http://localhost:4100'}/admin/login" 
               style="display: inline-block; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Go to Admin Panel
            </a>
          </div>
        </div>
      </div>
    `
  };

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending admin notification email:', error);
  }
};