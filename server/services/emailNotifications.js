import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email notification when new user signs up
 * @param {string} userEmail - New user's email
 * @param {string} fullName - New user's full name
 */
export const sendSignupNotification = async (userEmail, fullName) => {
  try {
    // Skip if no admin email configured
    if (!process.env.ADMIN_EMAIL) {
      console.log('Admin email not configured, skipping notification');
      return { success: false, message: 'Admin email not configured' };
    }

    // Skip if Resend API key not configured
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping notification');
      return { success: false, message: 'Resend not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Garde App <notifications@resend.dev>', // Use your domain later: notifications@yourdomain.com
      to: process.env.ADMIN_EMAIL,
      subject: `🎉 New User Sign-Up: ${fullName || userEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
            .label { font-weight: bold; color: #667eea; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔔 New User on Garde!</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">
                A new user just signed up for your Garde app! 🎉
              </p>

              <div class="info-row">
                <span class="label">📧 Email:</span> ${userEmail}
              </div>

              <div class="info-row">
                <span class="label">👤 Name:</span> ${fullName || 'Not provided'}
              </div>

              <div class="info-row">
                <span class="label">⏰ Time:</span> ${new Date().toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              <p style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-left: 4px solid #667eea; border-radius: 4px;">
                <strong>💡 Tip:</strong> Check your admin dashboard to see all user activity and analytics!
              </p>
            </div>
            <div class="footer">
              <p>This is an automated notification from your Garde app.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Failed to send signup notification:', error);
      return { success: false, error };
    }

    console.log('✅ Signup notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending signup notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email reminder for a guide
 * @param {string} userEmail - User's email
 * @param {string} title - Reminder title
 * @param {string} message - Custom message
 * @param {object} guide - Guide object with details
 */
export const sendReminderEmail = async (userEmail, title, message, guide) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping reminder');
      return { success: false, message: 'Resend not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Garde Reminders <reminders@resend.dev>', // Use your domain later
      to: userEmail,
      subject: `🔔 Reminder: ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .guide-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .ingredients, .steps { margin: 15px 0; }
            .ingredients ul, .steps ol { margin: 10px 0; padding-left: 25px; }
            .ingredients li, .steps li { margin: 8px 0; }
            .cta-button { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔔 Your Garde Reminder</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; font-weight: bold; color: #f5576c;">
                ${message}
              </p>

              <div class="guide-box">
                <h2 style="margin-top: 0; color: #333;">${guide.title}</h2>

                ${guide.ingredients && guide.ingredients.length > 0 ? `
                  <div class="ingredients">
                    <h3 style="color: #f5576c;">📝 Ingredients:</h3>
                    <ul>
                      ${guide.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${guide.steps && guide.steps.length > 0 ? `
                  <div class="steps">
                    <h3 style="color: #f5576c;">👨‍🍳 Steps:</h3>
                    <ol>
                      ${guide.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                  </div>
                ` : ''}

                ${guide.duration ? `<p><strong>⏱️ Time:</strong> ${guide.duration}</p>` : ''}
                ${guide.servings ? `<p><strong>🍽️ Servings:</strong> ${guide.servings}</p>` : ''}
                ${guide.difficulty ? `<p><strong>📊 Difficulty:</strong> ${guide.difficulty}</p>` : ''}
              </div>

              <p style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'https://garde-tau.vercel.app'}" class="cta-button">
                  Open Garde App →
                </a>
              </p>
            </div>
            <div class="footer">
              <p>You received this reminder because you set it in your Garde app.</p>
              <p>Manage your reminders in the app settings.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Failed to send reminder email:', error);
      return { success: false, error };
    }

    console.log('✅ Reminder email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send test email to verify configuration
 * @param {string} toEmail - Email to send test to
 */
export const sendTestEmail = async (toEmail) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, message: 'Resend API key not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Garde <notifications@resend.dev>',
      to: toEmail,
      subject: '✅ Garde Email Configuration Test',
      html: `
        <h1>Email Configuration Successful!</h1>
        <p>Your Garde app email notifications are working correctly.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Generic email sending function
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured');
      return { success: false, message: 'Resend not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Garde <notifications@resend.dev>',
      to,
      subject,
      html
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw error;
    }

    console.log('✅ Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send review-related notifications
 * @param {string} type - Notification type: 'new_review', 'review_published', 'admin_responded'
 * @param {object} data - Notification data
 */
export const sendReviewNotifications = async (type, data) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping review notification');
      return { success: false, message: 'Resend not configured' };
    }

    switch (type) {
      case 'new_review':
        // Notify admin of new review submission
        if (!process.env.ADMIN_EMAIL) {
          console.log('Admin email not configured, skipping notification');
          return { success: false, message: 'Admin email not configured' };
        }

        await resend.emails.send({
          from: 'Garde Reviews <notifications@resend.dev>',
          to: process.env.ADMIN_EMAIL,
          subject: `🌟 New Review Submitted - ${data.rating} Stars`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .info-row { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #667eea; }
                .label { font-weight: bold; color: #667eea; display: block; margin-bottom: 5px; }
                .stars { color: #fbbf24; font-size: 24px; margin: 10px 0; }
                .cta-button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🔔 New Review on Garde!</h1>
                </div>
                <div class="content">
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    A user just submitted a new review for Garde! 🎉
                  </p>

                  <div class="stars">${'⭐'.repeat(data.rating)}</div>

                  <div class="info-row">
                    <span class="label">👤 From:</span>
                    ${data.userName} (${data.userEmail})
                  </div>

                  <div class="info-row">
                    <span class="label">📝 Title:</span>
                    ${data.title}
                  </div>

                  <div class="info-row">
                    <span class="label">💬 Review:</span>
                    <p style="margin: 10px 0 0 0; white-space: pre-line;">${data.content}</p>
                  </div>

                  <div class="info-row">
                    <span class="label">⏰ Submitted:</span>
                    ${new Date().toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>

                  <p style="text-align: center;">
                    <a href="${process.env.CLIENT_URL || 'https://garde-tau.vercel.app'}/admin" class="cta-button">
                      Review in Admin Panel →
                    </a>
                  </p>

                  <p style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-left: 4px solid #667eea; border-radius: 4px; font-size: 14px;">
                    <strong>💡 Action Required:</strong> Please approve or reject this review in the admin panel.
                  </p>
                </div>
                <div class="footer">
                  <p>This is an automated notification from your Garde app.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        console.log('✅ New review notification sent to admin');
        break;

      case 'review_published':
        // Notify user their review was published
        await resend.emails.send({
          from: 'Garde Reviews <notifications@resend.dev>',
          to: data.userEmail,
          subject: '✅ Your Garde Review is Now Live!',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .highlight-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }
                .cta-button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🎉 Your Review is Live!</h1>
                </div>
                <div class="content">
                  <p style="font-size: 16px;">Hi ${data.userName},</p>

                  <div class="highlight-box">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">
                      Great news! Your review "<strong>${data.reviewTitle}</strong>" has been approved and is now visible to everyone on Garde.
                    </p>
                  </div>

                  <p>Thank you for taking the time to share your feedback with the community. Your insights help other users discover and understand Garde better!</p>

                  <p style="text-align: center;">
                    <a href="${process.env.CLIENT_URL || 'https://garde-tau.vercel.app'}/reviews" class="cta-button">
                      View Your Review →
                    </a>
                  </p>

                  <p style="margin-top: 30px; font-size: 14px; color: #666;">
                    We read every review carefully. If you have any additional feedback or questions, feel free to reply to this email.
                  </p>
                </div>
                <div class="footer">
                  <p>You're receiving this because you submitted a review on Garde.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        console.log('✅ Review published notification sent to user');
        break;

      case 'admin_responded':
        // Notify user of admin response
        await resend.emails.send({
          from: 'Garde Reviews <notifications@resend.dev>',
          to: data.userEmail,
          subject: '💬 Garde Team Responded to Your Review',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .review-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; border-radius: 6px; margin: 20px 0; }
                .response-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }
                .cta-button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">💬 Response to Your Review</h1>
                </div>
                <div class="content">
                  <p style="font-size: 16px;">Hi ${data.userName},</p>

                  <p>The Garde team has responded to your review "<strong>${data.reviewTitle}</strong>".</p>

                  <div class="review-box">
                    <p style="margin: 0; font-size: 12px; color: #667eea; font-weight: bold; text-transform: uppercase;">Your Review</p>
                    <p style="margin: 10px 0 0 0; font-style: italic;">"${data.reviewTitle}"</p>
                  </div>

                  <div class="response-box">
                    <p style="margin: 0; font-size: 12px; color: #10b981; font-weight: bold; text-transform: uppercase;">Our Response</p>
                    <p style="margin: 10px 0 0 0; white-space: pre-line;">${data.responseText}</p>
                  </div>

                  <p>We appreciate your feedback and hope this response is helpful!</p>

                  <p style="text-align: center;">
                    <a href="${process.env.CLIENT_URL || 'https://garde-tau.vercel.app'}/reviews" class="cta-button">
                      View Full Conversation →
                    </a>
                  </p>

                  <p style="margin-top: 30px; font-size: 14px; color: #666;">
                    Have more questions or feedback? Feel free to reply to this email.
                  </p>
                </div>
                <div class="footer">
                  <p>You're receiving this because you submitted a review on Garde.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        console.log('✅ Admin response notification sent to user');
        break;

      default:
        console.warn('Unknown review notification type:', type);
        return { success: false, message: 'Unknown notification type' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send review notification:', error);
    throw error;
  }
};
