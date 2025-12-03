import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { sendEmail } from './emailNotifications.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure web-push with VAPID keys (if available)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Send push notification to user
 */
async function sendPushNotification(userId, title, message, url) {
  try {
    // Skip if VAPID keys not configured
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.log('Push notifications not configured, skipping');
      return;
    }

    // Get user's push subscriptions
    const { data: subscriptions, error} = await supabase
      .from('push_subscriptions')
      .select('subscription_data')
      .eq('user_id', userId);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      url: url || '/'
    });

    // Send to all user's devices
    const promises = subscriptions.map(({ subscription_data }) =>
      webpush.sendNotification(subscription_data, payload).catch(err => {
        console.error('Error sending push to device:', err);
        // If subscription is invalid, remove it
        if (err.statusCode === 410) {
          supabase
            .from('push_subscriptions')
            .delete()
            .eq('subscription_data->endpoint', subscription_data.endpoint)
            .then(() => console.log('Removed invalid subscription'));
        }
      })
    );

    await Promise.all(promises);
    console.log(`Push notifications sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}

/**
 * Send reminder email
 */
async function sendReminderEmail(userEmail, title, message, guideName) {
  try {
    await sendEmail({
      to: userEmail,
      subject: `Reminder: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">🔔 Reminder from Garde</h2>
          <p style="font-size: 18px; font-weight: bold; margin: 20px 0;">${title}</p>
          ${message ? `<p style="color: #666; margin: 15px 0;">${message}</p>` : ''}
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">
              <strong>Guide:</strong> ${guideName}
            </p>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Open Garde to view your guide and start cooking!
          </p>
        </div>
      `
    });
    console.log(`Reminder email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
}

/**
 * Check and process due reminders
 */
async function checkReminders() {
  try {
    console.log('Checking for due reminders...');

    // Get all reminders that are due and not yet sent
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        guides (
          title
        ),
        profiles (
          id,
          email
        )
      `)
      .eq('sent', false)
      .lte('scheduled_for', new Date().toISOString());

    if (error) throw error;

    if (!reminders || reminders.length === 0) {
      console.log('No due reminders found');
      return;
    }

    console.log(`Found ${reminders.length} due reminder(s)`);

    // Process each reminder
    for (const reminder of reminders) {
      try {
        const { user_id, reminder_type, title, message, guides, profiles } = reminder;
        const guideName = guides?.title || 'Unknown Guide';
        const userEmail = profiles?.email;

        // Send email if needed
        if ((reminder_type === 'email' || reminder_type === 'both') && userEmail) {
          await sendReminderEmail(userEmail, title, message, guideName);
        }

        // Send push notification if needed
        if (reminder_type === 'push' || reminder_type === 'both') {
          await sendPushNotification(
            user_id,
            title,
            message || `Time to check out: ${guideName}`,
            `/`
          );
        }

        // Mark reminder as sent
        await supabase
          .from('reminders')
          .update({
            sent: true,
            sent_at: new Date().toISOString()
          })
          .eq('id', reminder.id);

        console.log(`Reminder ${reminder.id} sent successfully`);
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

/**
 * Start the reminder scheduler
 * Runs every minute
 */
function startReminderScheduler() {
  console.log('Starting reminder scheduler...');

  // Run every minute
  cron.schedule('* * * * *', () => {
    checkReminders();
  });

  console.log('Reminder scheduler started successfully');
}

export { startReminderScheduler, sendPushNotification, checkReminders };
