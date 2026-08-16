import { notifyOwner } from "./_core/notification";

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
}

/**
 * Send email notification using the built-in notification system
 * Since we don't have direct email access, we notify the owner who can forward
 */
async function sendEmailNotification(notification: EmailNotification): Promise<boolean> {
  const emailContent = `
📧 Email Notification Request

To: ${notification.to}
Subject: ${notification.subject}

${notification.body}
  `;
  
  return await notifyOwner({
    title: `Email: ${notification.subject}`,
    content: emailContent
  });
}

/**
 * Send welcome email when user is approved
 */
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  return sendEmailNotification({
    to: userEmail,
    subject: "Welcome to Future Stars FC Academy!",
    body: `Dear ${userName},

Congratulations! Your account has been approved.

You can now access the Future Stars FC Academy platform and start tracking your football development journey.

Login to your dashboard to:
- View your performance metrics
- Track your training progress
- Access personalized coaching feedback
- Connect with coaches and teammates

Welcome to the team!

Best regards,
Future Stars FC Academy Team`
  });
}

/**
 * Send rejection email when user application is rejected
 */
export async function sendRejectionEmail(userEmail: string, userName: string): Promise<boolean> {
  return sendEmailNotification({
    to: userEmail,
    subject: "Future Stars FC Academy - Application Status",
    body: `Dear ${userName},

Thank you for your interest in Future Stars FC Academy.

Unfortunately, we are unable to approve your application at this time.

If you have any questions, please contact us directly.

Best regards,
Future Stars FC Academy Team`
  });
}

/**
 * Send weekly progress report to parents
 */
export async function sendWeeklyProgressReport(
  parentEmail: string,
  parentName: string,
  playerName: string,
  metrics: {
    attendance: number;
    skillProgress: string;
    coachFeedback: string;
    upcomingEvents: string[];
  }
): Promise<boolean> {
  return sendEmailNotification({
    to: parentEmail,
    subject: `Weekly Progress Report - ${playerName}`,
    body: `Dear ${parentName},

Here's ${playerName}'s weekly progress report:

📊 ATTENDANCE
${metrics.attendance}% attendance this week

⚽ SKILL DEVELOPMENT
${metrics.skillProgress}

💬 COACH FEEDBACK
${metrics.coachFeedback}

📅 UPCOMING EVENTS
${metrics.upcomingEvents.map(event => `• ${event}`).join('\n')}

Keep up the great work!

Best regards,
Future Stars FC Academy Team`
  });
}

/**
 * Send coach feedback notification
 */
export async function sendCoachFeedbackEmail(
  parentEmail: string,
  playerName: string,
  feedback: string
): Promise<boolean> {
  return sendEmailNotification({
    to: parentEmail,
    subject: `New Coach Feedback for ${playerName}`,
    body: `You have received new feedback from the coaching staff for ${playerName}:

${feedback}

Login to your dashboard to view the full details.

Best regards,
Future Stars FC Academy Team`
  });
}
