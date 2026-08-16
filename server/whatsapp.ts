/**
 * WhatsApp Notification Service
 * Integrates with WhatsApp Business API to send match alerts and reports
 */

interface WhatsAppMessage {
  to: string; // Phone number in international format (e.g., +1234567890)
  message: string;
  type?: 'text' | 'template';
}

interface WhatsAppConfig {
  apiUrl: string;
  apiKey: string;
  businessPhoneId: string;
}

/**
 * Send WhatsApp message
 * Note: This requires WhatsApp Business API credentials
 * Users need to set up their own WhatsApp Business account
 */
export async function sendWhatsAppMessage(config: WhatsAppConfig, message: WhatsAppMessage): Promise<boolean> {
  try {
    // WhatsApp Cloud API endpoint
    const url = `${config.apiUrl}/${config.businessPhoneId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: message.to.replace(/[^0-9]/g, ''), // Remove non-numeric characters
      type: 'text',
      text: {
        body: message.message,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('WhatsApp API error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
}

/**
 * Send match alert via WhatsApp
 */
export async function sendMatchAlert(
  config: WhatsAppConfig,
  phoneNumber: string,
  alertType: 'fatigue' | 'goal' | 'card' | 'injury' | 'tactical',
  details: string
): Promise<boolean> {
  const alertMessages = {
    fatigue: `⚠️ *Fatigue Alert*\n\n${details}`,
    goal: `⚽ *Goal Alert*\n\n${details}`,
    card: `🟨 *Card Alert*\n\n${details}`,
    injury: `🏥 *Injury Alert*\n\n${details}`,
    tactical: `📊 *Tactical Update*\n\n${details}`,
  };

  return sendWhatsAppMessage(config, {
    to: phoneNumber,
    message: alertMessages[alertType],
  });
}

/**
 * Send post-match report via WhatsApp
 */
export async function sendPostMatchReport(
  config: WhatsAppConfig,
  phoneNumber: string,
  report: {
    opponent: string;
    score: string;
    summary: string;
    reportUrl?: string;
  }
): Promise<boolean> {
  const message = `📋 *Post-Match Report*

*Match:* vs ${report.opponent}
*Score:* ${report.score}

*Summary:*
${report.summary}

${report.reportUrl ? `\n🔗 Full Report: ${report.reportUrl}` : ''}`;

  return sendWhatsAppMessage(config, {
    to: phoneNumber,
    message,
  });
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phone: string, countryCode: string = '+966'): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/[^0-9]/g, '');
  
  // If it starts with 0, remove it (Saudi format)
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  
  // Add country code if not present
  if (!withoutLeadingZero.startsWith(countryCode.replace('+', ''))) {
    return `${countryCode}${withoutLeadingZero}`;
  }
  
  return `+${withoutLeadingZero}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Basic validation: should be 10-15 digits after cleaning
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}
