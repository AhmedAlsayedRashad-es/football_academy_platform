/**
 * WhatsApp Notification Service
 * 
 * This service handles sending WhatsApp messages for various notifications.
 * Currently configured to log messages. To enable actual WhatsApp sending:
 * 1. Sign up for WhatsApp Business API (Twilio, MessageBird, or Meta directly)
 * 2. Add API credentials to environment variables
 * 3. Uncomment the API integration code below
 */

interface WhatsAppMessage {
  to: string; // Phone number in E.164 format (e.g., +201234567890)
  message: string;
}

// WhatsApp message templates
const templates = {
  bookingConfirmation: (data: {
    userName: string;
    coachName: string;
    sessionDate: string;
    duration: number;
    sessionType: string;
  }): string => {
    const date = new Date(data.sessionDate).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `🎉 *Training Session Confirmed!*\n\nHi ${data.userName},\n\nYour private training session has been booked:\n\n⚽ *Coach:* ${data.coachName}\n📅 *Date:* ${date}\n⏱️ *Duration:* ${data.duration} min\n🏃 *Type:* ${data.sessionType}\n\nPlease arrive 10 minutes early. See you on the field!\n\n*Future Stars FC Academy*`;
  },

  bookingReminder: (data: {
    userName: string;
    coachName: string;
    sessionDate: string;
    duration: number;
  }): string => {
    const date = new Date(data.sessionDate).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `⏰ *Training Reminder - Tomorrow!*\n\nHi ${data.userName},\n\nThis is a reminder about your upcoming training session:\n\n⚽ *Coach:* ${data.coachName}\n📅 *Date:* ${date}\n⏱️ *Duration:* ${data.duration} min\n\nDon't forget to bring your training gear!\n\n*Future Stars FC Academy*`;
  },

  streakMilestone: (data: {
    userName: string;
    streakDays: number;
    reward: string;
  }): string => {
    return `🔥 *${data.streakDays}-Day Streak Achieved!*\n\nCongratulations ${data.userName}! 🎉\n\nYou've maintained your login streak for *${data.streakDays} consecutive days!*\n\n🎁 *Reward:* ${data.reward}\n\nKeep up the amazing dedication!\n\n*Future Stars FC Academy*`;
  },

  playerAbsence: (data: {
    parentName: string;
    playerName: string;
    sessionType: string;
    sessionDate: string;
  }): string => {
    const date = new Date(data.sessionDate).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    return `⚽ *Future Stars Academy - Absence Notice*\n\nDear ${data.parentName},\n\nWe wanted to let you know that *${data.playerName}* was marked *absent* from today's ${data.sessionType} session on ${date}.\n\nIf this was unexpected, please contact the academy.\n\n*Future Stars Academy*`;
  },

  coachBookingNotification: (data: {
    coachName: string;
    userName: string;
    sessionDate: string;
    duration: number;
    sessionType: string;
  }): string => {
    const date = new Date(data.sessionDate).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `📅 *New Training Session Booked*\n\nHi Coach ${data.coachName},\n\nA new session has been booked with you:\n\n👤 *Student:* ${data.userName}\n📅 *Date:* ${date}\n⏱️ *Duration:* ${data.duration} min\n🏃 *Type:* ${data.sessionType}\n\nPlease review and prepare accordingly.\n\n*Future Stars FC Academy*`;
  }
};

/**
 * Send WhatsApp message
 * @param to Phone number in E.164 format (e.g., +201234567890)
 * @param message Message content
 * @returns Promise<boolean> Success status
 */
export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    // Validate phone number format
    if (!to || !to.startsWith('+')) {
      return false;
    }
    console.log('[WhatsApp] Message:', message.substring(0, 100) + '...');

    // TODO: Integrate with WhatsApp Business API
    // Example with Twilio:
    // const accountSid = process.env.TWILIO_ACCOUNT_SID;
    // const authToken = process.env.TWILIO_AUTH_TOKEN;
    // const client = require('twilio')(accountSid, authToken);
    // 
    // await client.messages.create({
    //   from: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
    //   to: `whatsapp:${to}`,
    //   body: message
    // });

    // For now, just log the message
    console.log('[WhatsApp] ✓ Message logged successfully (API integration pending)');
    return true;
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error);
    return false;
  }
}

// Convenience functions
export async function sendBookingConfirmationWhatsApp(
  phone: string,
  data: Parameters<typeof templates.bookingConfirmation>[0]
): Promise<boolean> {
  const message = templates.bookingConfirmation(data);
  return sendWhatsAppMessage(phone, message);
}

export async function sendBookingReminderWhatsApp(
  phone: string,
  data: Parameters<typeof templates.bookingReminder>[0]
): Promise<boolean> {
  const message = templates.bookingReminder(data);
  return sendWhatsAppMessage(phone, message);
}

export async function sendStreakMilestoneWhatsApp(
  phone: string,
  data: Parameters<typeof templates.streakMilestone>[0]
): Promise<boolean> {
  const message = templates.streakMilestone(data);
  return sendWhatsAppMessage(phone, message);
}

export async function sendCoachBookingNotificationWhatsApp(
  phone: string,
  data: Parameters<typeof templates.coachBookingNotification>[0]
): Promise<boolean> {
  const message = templates.coachBookingNotification(data);
  return sendWhatsAppMessage(phone, message);
}

export async function sendMonthlyAttendanceReport(
  phone: string,
  data: {
    parentName: string;
    playerName: string;
    month: string;
    attendanceRate: number;
    totalSessions: number;
    presentSessions: number;
    pointsEarned: number;
    bonusAwarded: boolean;
  }
): Promise<boolean> {
  const emoji = data.attendanceRate >= 90 ? '🏆' : data.attendanceRate >= 75 ? '👍' : '⚠️';
  const message =
    `${emoji} *Future Stars Academy — Monthly Attendance Report*\n\n` +
    `Dear ${data.parentName},\n\n` +
    `Here is *${data.playerName}*'s attendance summary for *${data.month}*:\n\n` +
    `📊 Attendance Rate: *${data.attendanceRate}%*\n` +
    `📅 Sessions Attended: *${data.presentSessions} / ${data.totalSessions}*\n` +
    `⭐ Points Earned: *${data.pointsEarned} pts*\n` +
    (data.bonusAwarded ? `🏆 Perfect Attendance Bonus: *+100 pts awarded!*\n` : '') +
    `\nKeep up the great work!\n\n*Future Stars Academy*`;
  return sendWhatsAppMessage(phone, message);
}

export async function sendPlayerAbsenceNotification(
  phone: string,
  data: Parameters<typeof templates.playerAbsence>[0]
): Promise<boolean> {
  const message = templates.playerAbsence(data);
  return sendWhatsAppMessage(phone, message);
}

/**
 * Schedule booking reminder to be sent 24 hours before session
 * This would typically be handled by a cron job or scheduled task
 */
export async function scheduleBookingReminder(
  phone: string,
  sessionDate: string,
  data: Parameters<typeof templates.bookingReminder>[0]
): Promise<void> {
  // TODO: Integrate with a job scheduler (e.g., node-cron, Bull, or cloud scheduler)

  
  // Example with node-cron (would need to be implemented):
  // const reminderTime = new Date(sessionDate);
  // reminderTime.setHours(reminderTime.getHours() - 24);
  // schedule.scheduleJob(reminderTime, () => {
  //   sendBookingReminderWhatsApp(phone, data);
  // });
}
