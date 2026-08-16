// WhatsApp notification helper for booking notifications
// Uses WhatsApp click-to-chat links that can be shared with users

const ACADEMY_WHATSAPP = "201004186970";

export interface BookingNotificationData {
  parentName: string;
  playerName: string;
  coachName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  locationName?: string;
  price?: number;
}

// Generate WhatsApp message for booking confirmation
export function generateBookingConfirmationMessage(data: BookingNotificationData, language: 'en' | 'ar' = 'en'): string {
  if (language === 'ar') {
    return `مرحباً ${data.parentName}! 🎉

تم تأكيد حجز التدريب الخاص لـ ${data.playerName}:

📅 التاريخ: ${data.sessionDate}
⏰ الوقت: ${data.startTime} - ${data.endTime}
👨‍🏫 المدرب: ${data.coachName}
${data.locationName ? `📍 المكان: ${data.locationName}` : ''}
${data.price ? `💰 السعر: ${data.price} جنيه` : ''}

نتطلع لرؤية ${data.playerName} في الموعد!

أكاديمية Future Stars FC`;
  }

  return `Hello ${data.parentName}! 🎉

Your private training session for ${data.playerName} has been confirmed:

📅 Date: ${data.sessionDate}
⏰ Time: ${data.startTime} - ${data.endTime}
👨‍🏫 Coach: ${data.coachName}
${data.locationName ? `📍 Location: ${data.locationName}` : ''}
${data.price ? `💰 Price: ${data.price} EGP` : ''}

We look forward to seeing ${data.playerName}!

Future Stars FC Academy`;
}

// Generate WhatsApp message for booking cancellation
export function generateBookingCancellationMessage(data: BookingNotificationData, reason?: string, language: 'en' | 'ar' = 'en'): string {
  if (language === 'ar') {
    return `مرحباً ${data.parentName},

نأسف لإبلاغك بأنه تم إلغاء جلسة التدريب الخاص لـ ${data.playerName}:

📅 التاريخ: ${data.sessionDate}
⏰ الوقت: ${data.startTime} - ${data.endTime}
👨‍🏫 المدرب: ${data.coachName}
${reason ? `📝 السبب: ${reason}` : ''}

يرجى التواصل معنا لإعادة الجدولة.

أكاديمية Future Stars FC`;
  }

  return `Hello ${data.parentName},

We regret to inform you that the private training session for ${data.playerName} has been cancelled:

📅 Date: ${data.sessionDate}
⏰ Time: ${data.startTime} - ${data.endTime}
👨‍🏫 Coach: ${data.coachName}
${reason ? `📝 Reason: ${reason}` : ''}

Please contact us to reschedule.

Future Stars FC Academy`;
}

// Generate WhatsApp message for session reminder
export function generateSessionReminderMessage(data: BookingNotificationData, language: 'en' | 'ar' = 'en'): string {
  if (language === 'ar') {
    return `تذكير! 🔔

مرحباً ${data.parentName},

تذكير بجلسة التدريب الخاص لـ ${data.playerName} غداً:

📅 التاريخ: ${data.sessionDate}
⏰ الوقت: ${data.startTime} - ${data.endTime}
👨‍🏫 المدرب: ${data.coachName}
${data.locationName ? `📍 المكان: ${data.locationName}` : ''}

يرجى الحضور قبل 10 دقائق من الموعد.

أكاديمية Future Stars FC`;
  }

  return `Reminder! 🔔

Hello ${data.parentName},

This is a reminder about ${data.playerName}'s private training session tomorrow:

📅 Date: ${data.sessionDate}
⏰ Time: ${data.startTime} - ${data.endTime}
👨‍🏫 Coach: ${data.coachName}
${data.locationName ? `📍 Location: ${data.locationName}` : ''}

Please arrive 10 minutes before the session.

Future Stars FC Academy`;
}

// Generate WhatsApp click-to-chat URL
export function generateWhatsAppUrl(phoneNumber: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  // Remove any non-numeric characters from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

// Generate academy WhatsApp URL with message
export function generateAcademyWhatsAppUrl(message: string): string {
  return generateWhatsAppUrl(ACADEMY_WHATSAPP, message);
}
