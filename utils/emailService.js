// emailService.js
// KEA Email Service powered by Resend

import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization of Resend client
let resendClient = null;

const getResendClient = () => {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY is not defined in environment variables. Emails will not be sent.');
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

// Default sender address
const getDefaultFrom = () => {
  return process.env.EMAIL_FROM || 'Kokani Engineers & Professionals Association (KEA) <support@kokaniengineers.org>';
};

/**
 * Generic email sender using Resend API
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const client = getResendClient();
    if (!client) {
      console.warn(`⚠️ Skipped sending email to ${to}: RESEND_API_KEY missing`);
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    const recipient = Array.isArray(to) ? to : [to];
    let fromAddress = getDefaultFrom();

    let response = await client.emails.send({
      from: fromAddress,
      to: recipient,
      subject,
      html,
      ...(text ? { text } : {}),
    });

    // If custom domain is not verified yet in Resend, fallback to Resend's test sender
    if (response.error && response.error.message && response.error.message.toLowerCase().includes('domain')) {
      console.warn(`⚠️ Custom domain not verified in Resend yet (${fromAddress}). Retrying with onboarding@resend.dev fallback...`);
      fromAddress = 'KEA Support <onboarding@resend.dev>';
      response = await client.emails.send({
        from: fromAddress,
        to: recipient,
        subject,
        html,
        ...(text ? { text } : {}),
      });
    }

    if (response.error) {
      console.error('❌ Resend API Error:', response.error);
      return { success: false, error: response.error };
    }

    console.log(`✅ Email sent successfully to ${recipient.join(', ')} [ID: ${response.data?.id}]`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Unexpected error in sendEmail:', error);
    return { success: false, error: error.message };
  }
};

// =======================================
// 1. REGISTRATION & MEMBERSHIP EMAILS
// =======================================

// Send registration confirmation email
export const sendRegistrationEmail = async (userEmail, userName) => {
  const subject = '✅ KEA Registration Received - Pending Approval';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0D2847 0%, #1a3a5c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: #f59e0b; margin: 0; font-size: 24px; }
        .header p { color: #ffffff; margin: 8px 0 0 0; font-size: 14px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
        .info-box { background: white; border-left: 4px solid #0D2847; padding: 15px; margin: 20px 0; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to KEA!</h1>
          <p>Kokani Engineers & Professionals Association</p>
        </div>
        <div class="content">
          <p>Dear <strong>${userName}</strong>,</p>
          
          <p>Thank you for registering with the <strong>Kokani Engineers & Professionals Association (KEA)</strong>!</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #0D2847;">📋 Registration Status: PENDING APPROVAL</h3>
            <p style="margin-bottom: 0;">Your membership application has been received and is currently being reviewed by our administrative committee.</p>
          </div>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our administrative team will verify your application details</li>
            <li>You will receive an email confirmation once your membership is approved</li>
            <li>Upon approval, you will gain full access to the member portal, directory, and resources</li>
          </ul>
          
          <p><strong>Your registered email:</strong> ${userEmail}</p>
          
          <div class="info-box" style="border-left-color: #f59e0b; background: #fffbeb;">
            <p style="margin: 0; color: #92400e;"><strong>💡 Note:</strong> If you don't receive an update within 48-72 hours, please check your spam/promotions folder or contact our support team.</p>
          </div>
          
          <p>If you have any questions, please reach out to us at <a href="mailto:support@kokaniengineers.org" style="color: #0D2847; font-weight: bold;">support@kokaniengineers.org</a>.</p>
          
          <p>Best regards,<br><strong>KEA Administrative Team</strong><br>Kokani Engineers & Professionals Association</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Kokani Engineers & Professionals Association (KEA). All rights reserved.</p>
          <p>This is an automated message. Please contact <a href="mailto:support@kokaniengineers.org">support@kokaniengineers.org</a> for inquiries.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

// Send membership approval email
export const sendApprovalEmail = async (userEmail, userName) => {
  const subject = '🎉 KEA Membership Approved - Welcome Aboard!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0D2847 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .btn { display: inline-block; background: #0D2847; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎊 Congratulations, ${userName}!</h1>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #065f46;">✅ Your KEA Membership is APPROVED!</h2>
            <p style="margin-bottom: 0; color: #047857;">Your application has been reviewed and approved by the Kokani Engineers & Professionals Association committee.</p>
          </div>
          
          <p>Dear <strong>${userName}</strong>,</p>
          
          <p>Welcome to the <strong>Kokani Engineers & Professionals Association (KEA)</strong>! We are thrilled to have you as part of our global network.</p>
          
          <p><strong>Your Member Privileges:</strong></p>
          <ul>
            <li>✅ Full access to the member dashboard & professional directory</li>
            <li>✅ Search and connect with fellow Kokani engineers & professionals</li>
            <li>✅ Access exclusive engineering tools, resources, and webinars</li>
            <li>✅ Apply for exclusive community job openings and mentorship programs</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'https://user.kea.nexcorealliance.com'}/login" class="btn">
              🚀 Log In to Your Account
            </a>
          </div>
          
          <p><strong>Your registered email:</strong> ${userEmail}</p>
          
          <p>Thank you for joining KEA. We look forward to your active contribution and networking within the community!</p>
          
          <p>Best regards,<br><strong>KEA Administrative Team</strong><br>Kokani Engineers & Professionals Association</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Kokani Engineers & Professionals Association (KEA). All rights reserved.</p>
          <p>Support: <a href="mailto:support@kokaniengineers.org">support@kokaniengineers.org</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

// Send rejection email
export const sendRejectionEmail = async (userEmail, userName, reason = '') => {
  const subject = 'KEA Membership Application - Update Required';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
        .info-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KEA Membership Application Status</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${userName}</strong>,</p>
          
          <p>Thank you for your interest in joining the <strong>Kokani Engineers & Professionals Association (KEA)</strong>.</p>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>Application Status:</strong> Additional Information Required</p>
            ${reason ? `<p style="margin: 8px 0 0 0;"><strong>Feedback / Reason:</strong> ${reason}</p>` : ''}
          </div>
          
          <p>We require additional verification before your membership can be finalized.</p>
          
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Please review your submitted credentials and professional details</li>
            <li>Contact our support team at <a href="mailto:support@kokaniengineers.org">support@kokaniengineers.org</a> for clarification</li>
          </ul>
          
          <p>Best regards,<br><strong>KEA Administrative Team</strong><br>Kokani Engineers & Professionals Association</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Kokani Engineers & Professionals Association (KEA). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

// =======================================
// 2. PASSWORD RESET EMAILS
// =======================================

export const sendPasswordResetEmail = async (userEmail, userName, resetUrl) => {
  const subject = '🔐 KEA Password Reset Request';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0D2847; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: #f59e0b; margin: 0; font-size: 22px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
        .btn { display: inline-block; background: #0D2847; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${userName || 'KEA Member'}</strong>,</p>
          <p>We received a request to reset the password for your KEA account associated with <strong>${userEmail}</strong>.</p>
          <p>Click the button below to reset your password. This link is valid for 10 minutes:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>
          
          <p style="font-size: 13px; color: #6b7280;">If you did not request this password reset, please ignore this email or contact support if you suspect unauthorized activity.</p>
          
          <p>Best regards,<br><strong>KEA Security Team</strong><br>Kokani Engineers & Professionals Association</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Kokani Engineers & Professionals Association (KEA). All rights reserved.</p>
          <p>Support: <a href="mailto:support@kokaniengineers.org">support@kokaniengineers.org</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

// =======================================
// 3. EVENT EMAILS
// =======================================

export const sendEventRegistrationEmail = async (userEmail, userName, eventTitle) => {
  const subject = `📋 Registration Received: ${eventTitle}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #0D2847; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Event Registration</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; background: #fafafa;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your registration request for <strong>${eventTitle}</strong> has been received.</p>
        <div style="background: #f0fdfa; border-left: 4px solid #0D2847; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Status:</strong> Pending Confirmation</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">The event coordinator will review your request shortly.</p>
        </div>
        <p>You will receive a confirmation email once your seat is confirmed.</p>
        <p>Best regards,<br/><strong>KEA Events Team</strong><br/>Kokani Engineers & Professionals Association</p>
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

export const sendEventApprovalEmail = async (userEmail, userName, eventTitle) => {
  const subject = `✅ Registration Confirmed: ${eventTitle}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #059669; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Event Registration Confirmed</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; background: #fafafa;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Great news! Your seat for <strong>${eventTitle}</strong> has been <strong>CONFIRMED</strong>.</p>
        <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;">You are now officially registered for this event.</p>
        </div>
        <p>We look forward to seeing you there!</p>
        <p>Best regards,<br/><strong>KEA Events Team</strong><br/>Kokani Engineers & Professionals Association</p>
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

// =======================================
// 4. GROUP EMAILS
// =======================================

export const sendGroupJoinRequestEmail = async (userEmail, userName, groupName) => {
  const subject = `📋 Join Request: ${groupName}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #0D2847; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Group Join Request</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; background: #fafafa;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your request to join the group <strong>${groupName}</strong> has been submitted.</p>
        <div style="background: #eff6ff; border-left: 4px solid #0D2847; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Status:</strong> Awaiting Group Admin Approval</p>
        </div>
        <p>We will notify you once the group administrator reviews your request.</p>
        <p>Best regards,<br/><strong>KEA Community Team</strong><br/>Kokani Engineers & Professionals Association</p>
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

export const sendGroupApprovalEmail = async (userEmail, userName, groupName) => {
  const subject = `🎉 Welcome to ${groupName}!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #0D2847; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Group Access Approved</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; background: #fafafa;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Welcome! Your request to join <strong>${groupName}</strong> has been <strong>APPROVED</strong>.</p>
        <div style="background: #eff6ff; border-left: 4px solid #0D2847; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;">You can now participate in discussions, access shared materials, and collaborate with group members.</p>
        </div>
        <p>Happy networking!</p>
        <p>Best regards,<br/><strong>KEA Community Team</strong><br/>Kokani Engineers & Professionals Association</p>
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

// =======================================
// 5. CONTENT SUBMISSION & MODERATION EMAILS
// =======================================

export const sendContentApprovalEmail = async (userEmail, userName, contentType, contentTitle) => {
  const subject = `✅ Approved: Your ${contentType} "${contentTitle}" is live!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #10b981; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Content Approved!</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; background: #fafafa;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your submitted ${contentType.toLowerCase()} <strong>"${contentTitle}"</strong> has been reviewed and <strong>APPROVED</strong> by our editorial team.</p>
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;">It is now live on the KEA platform for all members to view.</p>
        </div>
        <p>Thank you for contributing to the KEA community!</p>
        <p>Best regards,<br/><strong>KEA Editorial Team</strong><br/>Kokani Engineers & Professionals Association</p>
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

export const sendContentRejectionEmail = async (userEmail, userName, contentType, contentTitle, reason = '') => {
  const subject = `❌ Update: Your ${contentType} "${contentTitle}" status`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #ef4444; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Content Review Update</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; background: #fafafa;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Regarding your submitted ${contentType.toLowerCase()} <strong>"${contentTitle}"</strong>:</p>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;"><strong>Status:</strong> Not Approved</p>
          ${reason ? `<p style="margin: 10px 0 0 0; color: #7f1d1d;"><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        <p>If you have any questions or would like to submit revisions, please reach out to <a href="mailto:support@kokaniengineers.org">support@kokaniengineers.org</a>.</p>
        <p>Best regards,<br/><strong>KEA Editorial Team</strong><br/>Kokani Engineers & Professionals Association</p>
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, html });
};

// =======================================
// 6. ADMIN & SYSTEM NOTIFICATIONS
// =======================================

export const sendAdminNotificationEmail = async (adminEmail, subject, title, message) => {
  const emailSubject = `🔔 Admin Alert: ${subject}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background: #0D2847; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Admin Notification</h1>
      </div>
      <div style="padding: 20px; background: #ffffff;">
        <h2 style="color: #0D2847; margin-top: 0; font-size: 18px;">${title}</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #475569;">${message}</p>
        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <a href="${process.env.ADMIN_URL || 'https://admin.kea.nexcorealliance.com'}/admin/login" 
             style="display: inline-block; background: #0D2847; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Open Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: adminEmail, subject: emailSubject, html });
};

// Send Test Email using Resend
export const sendTestEmail = async (recipientEmail) => {
  const subject = 'KEA: Resend API Test Email';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #0D2847; margin-top: 0;">Kokani Engineers & Professionals Association (KEA)</h2>
      <p>This is a test email sent using the <strong>Resend API</strong> service.</p>
      <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin: 16px 0;">
        <p style="margin: 0; color: #065f46; font-weight: bold;">✅ Resend Email Service is configured and functioning correctly!</p>
      </div>
      <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">Sent at: ${new Date().toISOString()}</p>
    </div>
  `;

  return sendEmail({ to: recipientEmail, subject, html });
};

export default {
  sendRegistrationEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendPasswordResetEmail,
  sendEventRegistrationEmail,
  sendEventApprovalEmail,
  sendGroupJoinRequestEmail,
  sendGroupApprovalEmail,
  sendContentApprovalEmail,
  sendContentRejectionEmail,
  sendAdminNotificationEmail,
  sendTestEmail,
};