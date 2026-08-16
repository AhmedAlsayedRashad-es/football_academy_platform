// Email notification helper for booking notifications
// Uses the Manus notification service to send emails to the academy owner
// For user-facing emails, we generate email content that can be sent via external service

import { notifyOwner } from "./_core/notification";

export interface BookingEmailData {
  parentName: string;
  parentEmail?: string;
  playerName: string;
  coachName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  locationName?: string;
  price?: number;
}

// Notify academy owner about new booking
export async function notifyOwnerNewBooking(data: BookingEmailData): Promise<boolean> {
  const title = `New Private Training Booking - ${data.playerName}`;
  const content = `
A new private training session has been booked:

Player: ${data.playerName}
Parent: ${data.parentName}${data.parentEmail ? ` (${data.parentEmail})` : ''}
Coach: ${data.coachName}
Date: ${data.sessionDate}
Time: ${data.startTime} - ${data.endTime}
${data.locationName ? `Location: ${data.locationName}` : ''}
${data.price ? `Price: ${data.price} EGP` : ''}

Please review and confirm the booking in the admin dashboard.
  `.trim();

  return notifyOwner({ title, content });
}

// Notify academy owner about booking confirmation
export async function notifyOwnerBookingConfirmed(data: BookingEmailData): Promise<boolean> {
  const title = `Booking Confirmed - ${data.playerName}`;
  const content = `
A private training session has been confirmed:

Player: ${data.playerName}
Parent: ${data.parentName}
Coach: ${data.coachName}
Date: ${data.sessionDate}
Time: ${data.startTime} - ${data.endTime}
${data.locationName ? `Location: ${data.locationName}` : ''}

The parent has been notified via WhatsApp.
  `.trim();

  return notifyOwner({ title, content });
}

// Notify academy owner about booking cancellation
export async function notifyOwnerBookingCancelled(data: BookingEmailData, reason?: string): Promise<boolean> {
  const title = `Booking Cancelled - ${data.playerName}`;
  const content = `
A private training session has been cancelled:

Player: ${data.playerName}
Parent: ${data.parentName}
Coach: ${data.coachName}
Date: ${data.sessionDate}
Time: ${data.startTime} - ${data.endTime}
${reason ? `Reason: ${reason}` : ''}

The slot is now available for other bookings.
  `.trim();

  return notifyOwner({ title, content });
}

// Generate email HTML for booking confirmation (for future email service integration)
export function generateBookingConfirmationEmail(data: BookingEmailData): { subject: string; html: string; text: string } {
  const subject = `Training Session Confirmed - ${data.sessionDate}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0891b2, #0d9488); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-label { font-weight: bold; width: 100px; color: #6b7280; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .cta { display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚽ Training Session Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hello ${data.parentName},</p>
      <p>Great news! Your private training session for <strong>${data.playerName}</strong> has been confirmed.</p>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">📅 Date:</span>
          <span>${data.sessionDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">⏰ Time:</span>
          <span>${data.startTime} - ${data.endTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">👨‍🏫 Coach:</span>
          <span>${data.coachName}</span>
        </div>
        ${data.locationName ? `
        <div class="detail-row">
          <span class="detail-label">📍 Location:</span>
          <span>${data.locationName}</span>
        </div>
        ` : ''}
        ${data.price ? `
        <div class="detail-row">
          <span class="detail-label">💰 Price:</span>
          <span>${data.price} EGP</span>
        </div>
        ` : ''}
      </div>
      
      <p>Please arrive 10 minutes before the session starts.</p>
      
      <p>If you need to make any changes, please contact us via WhatsApp.</p>
      
      <a href="https://wa.me/201004186970" class="cta">Contact Us on WhatsApp</a>
    </div>
    <div class="footer">
      <p>Future Stars FC Academy</p>
      <p>Egypt's Premier Youth Football Academy</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Training Session Confirmed!

Hello ${data.parentName},

Your private training session for ${data.playerName} has been confirmed.

📅 Date: ${data.sessionDate}
⏰ Time: ${data.startTime} - ${data.endTime}
👨‍🏫 Coach: ${data.coachName}
${data.locationName ? `📍 Location: ${data.locationName}` : ''}
${data.price ? `💰 Price: ${data.price} EGP` : ''}

Please arrive 10 minutes before the session starts.

If you need to make any changes, please contact us via WhatsApp: https://wa.me/201004186970

Future Stars FC Academy
Egypt's Premier Youth Football Academy
  `.trim();

  return { subject, html, text };
}

// Generate email HTML for session reminder
export function generateSessionReminderEmail(data: BookingEmailData): { subject: string; html: string; text: string } {
  const subject = `Reminder: Training Session Tomorrow - ${data.sessionDate}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-label { font-weight: bold; width: 100px; color: #6b7280; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .reminder-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Training Session Reminder</h1>
    </div>
    <div class="content">
      <p>Hello ${data.parentName},</p>
      <p>This is a friendly reminder about <strong>${data.playerName}'s</strong> training session <strong>tomorrow</strong>.</p>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">📅 Date:</span>
          <span>${data.sessionDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">⏰ Time:</span>
          <span>${data.startTime} - ${data.endTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">👨‍🏫 Coach:</span>
          <span>${data.coachName}</span>
        </div>
        ${data.locationName ? `
        <div class="detail-row">
          <span class="detail-label">📍 Location:</span>
          <span>${data.locationName}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="reminder-box">
        <strong>⚡ Please remember:</strong>
        <ul>
          <li>Arrive 10 minutes before the session</li>
          <li>Bring water and appropriate training gear</li>
          <li>Wear proper football boots</li>
        </ul>
      </div>
      
      <p>We look forward to seeing ${data.playerName} tomorrow!</p>
    </div>
    <div class="footer">
      <p>Future Stars FC Academy</p>
      <p>Egypt's Premier Youth Football Academy</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
🔔 Training Session Reminder

Hello ${data.parentName},

This is a friendly reminder about ${data.playerName}'s training session tomorrow.

📅 Date: ${data.sessionDate}
⏰ Time: ${data.startTime} - ${data.endTime}
👨‍🏫 Coach: ${data.coachName}
${data.locationName ? `📍 Location: ${data.locationName}` : ''}

Please remember:
- Arrive 10 minutes before the session
- Bring water and appropriate training gear
- Wear proper football boots

We look forward to seeing ${data.playerName} tomorrow!

Future Stars FC Academy
Egypt's Premier Youth Football Academy
  `.trim();

  return { subject, html, text };
}
