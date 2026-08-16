import { sendWelcomeEmail } from './emailNotifications';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email templates
const templates = {
  bookingConfirmationUser: (data: {
    userName: string;
    coachName: string;
    sessionDate: string;
    duration: number;
    sessionType: string;
    totalPrice: number;
  }): EmailTemplate => ({
    subject: 'Training Session Booking Confirmed - Future Stars FC',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Training Session Confirmed! 🎉</h2>
        <p>Hi ${data.userName},</p>
        <p>Your private training session has been successfully booked!</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Coach:</strong> ${data.coachName}</p>
          <p><strong>Date & Time:</strong> ${new Date(data.sessionDate).toLocaleString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          <p><strong>Session Type:</strong> ${data.sessionType}</p>
          <p><strong>Total Price:</strong> ${data.totalPrice} EGP</p>
        </div>
        
        <p>Please arrive 10 minutes early and bring your training gear.</p>
        <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        
        <p>See you on the field!</p>
        <p><strong>Future Stars FC Academy</strong></p>
      </div>
    `,
    text: `Training Session Confirmed!\n\nHi ${data.userName},\n\nYour private training session has been successfully booked!\n\nBooking Details:\nCoach: ${data.coachName}\nDate & Time: ${new Date(data.sessionDate).toLocaleString()}\nDuration: ${data.duration} minutes\nSession Type: ${data.sessionType}\nTotal Price: ${data.totalPrice} EGP\n\nPlease arrive 10 minutes early and bring your training gear.\n\nSee you on the field!\nFuture Stars FC Academy`
  }),

  bookingConfirmationCoach: (data: {
    coachName: string;
    userName: string;
    sessionDate: string;
    duration: number;
    sessionType: string;
    notes?: string;
  }): EmailTemplate => ({
    subject: 'New Training Session Booking - Future Stars FC',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">New Training Session Booked 📅</h2>
        <p>Hi Coach ${data.coachName},</p>
        <p>A new private training session has been booked with you!</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Session Details:</h3>
          <p><strong>Student:</strong> ${data.userName}</p>
          <p><strong>Date & Time:</strong> ${new Date(data.sessionDate).toLocaleString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          <p><strong>Session Type:</strong> ${data.sessionType}</p>
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        
        <p>Please review the session details and prepare accordingly.</p>
        
        <p>Best regards,</p>
        <p><strong>Future Stars FC Academy</strong></p>
      </div>
    `,
    text: `New Training Session Booked\n\nHi Coach ${data.coachName},\n\nA new private training session has been booked with you!\n\nSession Details:\nStudent: ${data.userName}\nDate & Time: ${new Date(data.sessionDate).toLocaleString()}\nDuration: ${data.duration} minutes\nSession Type: ${data.sessionType}\n${data.notes ? `Notes: ${data.notes}\n` : ''}\nPlease review the session details and prepare accordingly.\n\nBest regards,\nFuture Stars FC Academy`
  }),

  testimonialApproved: (data: {
    userName: string;
    testimonial: string;
    isFeatured: boolean;
  }): EmailTemplate => ({
    subject: 'Your Testimonial Has Been Approved! - Future Stars FC',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Thank You for Your Feedback! ⭐</h2>
        <p>Hi ${data.userName},</p>
        <p>Great news! Your testimonial has been approved and is now live on our website.</p>
        
        ${data.isFeatured ? `
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>🌟 Featured Testimonial!</strong></p>
            <p style="margin: 5px 0 0 0;">Your testimonial has been selected as a featured review and will be prominently displayed on our home page!</p>
          </div>
        ` : ''}
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-style: italic; margin: 0;">"${data.testimonial}"</p>
        </div>
        
        <p>Thank you for sharing your experience with Future Stars FC Academy. Your feedback helps us continue to provide the best training for young athletes!</p>
        
        <p>Best regards,</p>
        <p><strong>Future Stars FC Academy</strong></p>
      </div>
    `,
    text: `Thank You for Your Feedback!\n\nHi ${data.userName},\n\nGreat news! Your testimonial has been approved and is now live on our website.\n\n${data.isFeatured ? 'Your testimonial has been selected as a featured review!\n\n' : ''}"${data.testimonial}"\n\nThank you for sharing your experience with Future Stars FC Academy.\n\nBest regards,\nFuture Stars FC Academy`
  }),

  streakMilestone: (data: {
    userName: string;
    streakDays: number;
    reward: string;
  }): EmailTemplate => ({
    subject: `🔥 ${data.streakDays}-Day Streak Milestone Achieved! - Future Stars FC`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Congratulations! 🎉🔥</h2>
        <p>Hi ${data.userName},</p>
        <p>You've achieved an amazing milestone!</p>
        
        <div style="background-color: #fef3c7; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h1 style="color: #ea580c; font-size: 48px; margin: 0;">${data.streakDays} Days</h1>
          <p style="font-size: 20px; margin: 10px 0 0 0;">Login Streak! 🔥</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Reward:</h3>
          <p style="font-size: 18px; color: #ea580c; margin: 0;"><strong>${data.reward}</strong></p>
        </div>
        
        <p>Your dedication to consistent training is impressive! Keep logging in daily to maintain your streak and unlock even more rewards.</p>
        
        <p>Keep up the great work!</p>
        <p><strong>Future Stars FC Academy</strong></p>
      </div>
    `,
    text: `Congratulations!\n\nHi ${data.userName},\n\nYou've achieved an amazing milestone!\n\n${data.streakDays} Days Login Streak! 🔥\n\nYour Reward: ${data.reward}\n\nYour dedication to consistent training is impressive! Keep logging in daily to maintain your streak and unlock even more rewards.\n\nKeep up the great work!\nFuture Stars FC Academy`
  })
};

// Email sending function
export async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  try {
    // For now, we'll use the existing sendWelcomeEmail infrastructure
    // In production, you would integrate with an email service like SendGrid, AWS SES, or Resend
    
    console.log(`[Email Service] Sending email to: ${to}`);
    console.log(`[Email Service] Subject: ${template.subject}`);
    console.log(`[Email Service] Content: ${template.text.substring(0, 100)}...`);
    
    // TODO: Integrate with actual email service
    // await emailProvider.send({
    //   to,
    //   subject: template.subject,
    //   html: template.html,
    //   text: template.text
    // });
    
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    return false;
  }
}

// Convenience functions
export async function sendBookingConfirmationToUser(
  userEmail: string,
  data: Parameters<typeof templates.bookingConfirmationUser>[0]
): Promise<boolean> {
  const template = templates.bookingConfirmationUser(data);
  return sendEmail(userEmail, template);
}

export async function sendBookingConfirmationToCoach(
  coachEmail: string,
  data: Parameters<typeof templates.bookingConfirmationCoach>[0]
): Promise<boolean> {
  const template = templates.bookingConfirmationCoach(data);
  return sendEmail(coachEmail, template);
}

export async function sendTestimonialApprovalEmail(
  userEmail: string,
  data: Parameters<typeof templates.testimonialApproved>[0]
): Promise<boolean> {
  const template = templates.testimonialApproved(data);
  return sendEmail(userEmail, template);
}

export async function sendStreakMilestoneEmail(
  userEmail: string,
  data: Parameters<typeof templates.streakMilestone>[0]
): Promise<boolean> {
  const template = templates.streakMilestone(data);
  return sendEmail(userEmail, template);
}

// Career Application Status Email
export async function sendCareerApplicationStatusEmail(
  applicantEmail: string,
  data: {
    applicantName: string;
    position: string;
    status: 'approved' | 'rejected' | 'under_review';
    adminNotes?: string;
  }
): Promise<boolean> {
  const statusMessages = {
    approved: {
      title: 'Application Approved! 🎉',
      message: `Congratulations! Your application for the position of <strong>${data.position}</strong> has been approved.`,
      color: '#10b981',
      nextSteps: 'Our HR team will contact you within 2-3 business days to discuss the next steps.',
    },
    rejected: {
      title: 'Application Update',
      message: `Thank you for your interest in the <strong>${data.position}</strong> position. After careful consideration, we have decided to move forward with other candidates.`,
      color: '#ef4444',
      nextSteps: 'We encourage you to apply for future openings that match your qualifications.',
    },
    under_review: {
      title: 'Application Under Review 📋',
      message: `Your application for the position of <strong>${data.position}</strong> is currently under review.`,
      color: '#f59e0b',
      nextSteps: 'We will notify you of our decision within 5-7 business days.',
    },
  };

  const statusInfo = statusMessages[data.status];

  const template: EmailTemplate = {
    subject: `Career Application Update - ${data.position}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>⚽ Future Stars FC</h1>
          <p>Football Academy</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>${statusInfo.title}</h2>
          <p>Dear ${data.applicantName},</p>
          <p>${statusInfo.message}</p>
          <div style="display: inline-block; padding: 10px 20px; background: ${statusInfo.color}; color: white; border-radius: 5px; font-weight: bold; margin: 20px 0;">
            Status: ${data.status.replace('_', ' ').toUpperCase()}
          </div>
          ${data.adminNotes ? `
            <div style="background: #fff; padding: 15px; border-left: 4px solid ${statusInfo.color}; margin: 20px 0;">
              <strong>Additional Notes:</strong>
              <p>${data.adminNotes}</p>
            </div>
          ` : ''}
          <p><strong>Next Steps:</strong></p>
          <p>${statusInfo.nextSteps}</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br><strong>Future Stars FC HR Team</strong></p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>© 2026 Future Stars FC. All rights reserved.</p>
          <p>📧 careers@futurestarsfc.com | 📱 +201004186970</p>
        </div>
      </div>
    `,
    text: `${statusInfo.title}\n\nDear ${data.applicantName},\n\n${statusInfo.message.replace(/<[^>]*>/g, '')}\n\nStatus: ${data.status.replace('_', ' ').toUpperCase()}\n\n${data.adminNotes ? `Additional Notes: ${data.adminNotes}\n\n` : ''}Next Steps: ${statusInfo.nextSteps}\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nFuture Stars FC HR Team`
  };

  return sendEmail(applicantEmail, template);
}

// Course Completion Email
export async function sendCourseCompletionEmail(
  parentEmail: string,
  data: {
    parentName: string;
    courseName: string;
    completionDate: Date;
    score?: number;
    certificateUrl?: string;
  }
): Promise<boolean> {
  const template: EmailTemplate = {
    subject: `🎉 Course Completed: ${data.courseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>⚽ Future Stars FC</h1>
          <p>Parent Education Academy</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>🎉 Congratulations on Completing the Course!</h2>
          <p>Dear ${data.parentName},</p>
          <p>We are thrilled to inform you that you have successfully completed the course:</p>
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
            <h3>${data.courseName}</h3>
            <p><strong>Completion Date:</strong> ${data.completionDate.toLocaleDateString()}</p>
            ${data.score ? `<p><strong>Final Score:</strong> ${data.score}%</p>` : ''}
          </div>
          <p>Your dedication to learning and improving your understanding of youth football development is commendable. The knowledge you've gained will help you better support your child's football journey.</p>
          ${data.certificateUrl ? `
            <p style="text-align: center;">
              <a href="${data.certificateUrl}" style="display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">📜 Download Your Certificate</a>
            </p>
          ` : ''}
          <p><strong>What's Next?</strong></p>
          <ul>
            <li>Explore more courses in the Parent Education Academy</li>
            <li>Apply what you've learned to support your child's development</li>
            <li>Share your certificate on social media</li>
            <li>Join our parent community discussions</li>
          </ul>
          <p>Keep up the great work!</p>
          <p>Best regards,<br><strong>Future Stars FC Education Team</strong></p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>© 2026 Future Stars FC. All rights reserved.</p>
          <p>📧 education@futurestarsfc.com | 📱 +201004186970</p>
        </div>
      </div>
    `,
    text: `Congratulations on Completing the Course!\n\nDear ${data.parentName},\n\nWe are thrilled to inform you that you have successfully completed the course:\n\n${data.courseName}\nCompletion Date: ${data.completionDate.toLocaleDateString()}\n${data.score ? `Final Score: ${data.score}%\n` : ''}\nYour dedication to learning and improving your understanding of youth football development is commendable.\n\n${data.certificateUrl ? `Download Your Certificate: ${data.certificateUrl}\n\n` : ''}What's Next?\n- Explore more courses in the Parent Education Academy\n- Apply what you've learned to support your child's development\n- Share your certificate on social media\n- Join our parent community discussions\n\nKeep up the great work!\n\nBest regards,\nFuture Stars FC Education Team`
  };

  return sendEmail(parentEmail, template);
}

// Quiz Completion Email
export async function sendQuizCompletionEmail(
  parentEmail: string,
  data: {
    parentName: string;
    courseName: string;
    lessonName: string;
    score: number;
    passed: boolean;
    totalQuestions: number;
    correctAnswers: number;
  }
): Promise<boolean> {
  const template: EmailTemplate = {
    subject: `Quiz ${data.passed ? 'Passed' : 'Completed'}: ${data.lessonName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>⚽ Future Stars FC</h1>
          <p>Parent Education Academy</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>${data.passed ? '🎉 Quiz Passed!' : '📚 Quiz Completed'}</h2>
          <p>Dear ${data.parentName},</p>
          <p>You have completed the quiz for:</p>
          <p><strong>Course:</strong> ${data.courseName}<br>
          <strong>Lesson:</strong> ${data.lessonName}</p>
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 48px; font-weight: bold; color: ${data.passed ? '#10b981' : '#ef4444'};">${data.score}%</div>
            <p>${data.correctAnswers} out of ${data.totalQuestions} correct</p>
            <div style="padding: 10px 20px; background: ${data.passed ? '#10b981' : '#ef4444'}; color: white; border-radius: 5px; display: inline-block; margin: 10px 0;">
              ${data.passed ? 'PASSED ✓' : 'NEEDS REVIEW'}
            </div>
          </div>
          ${data.passed ? `
            <p>Excellent work! You've demonstrated a strong understanding of the material. Keep up the great progress!</p>
          ` : `
            <p>You scored below the passing threshold (70%). We encourage you to review the lesson material and try again. Remember, learning is a journey!</p>
            <p><strong>Tips for improvement:</strong></p>
            <ul>
              <li>Review the lesson content carefully</li>
              <li>Watch the video materials again</li>
              <li>Take notes on key concepts</li>
              <li>Retake the quiz when you're ready</li>
            </ul>
          `}
          <p>Best regards,<br><strong>Future Stars FC Education Team</strong></p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>© 2026 Future Stars FC. All rights reserved.</p>
          <p>📧 education@futurestarsfc.com | 📱 +201004186970</p>
        </div>
      </div>
    `,
    text: `${data.passed ? 'Quiz Passed!' : 'Quiz Completed'}\n\nDear ${data.parentName},\n\nYou have completed the quiz for:\nCourse: ${data.courseName}\nLesson: ${data.lessonName}\n\nScore: ${data.score}%\n${data.correctAnswers} out of ${data.totalQuestions} correct\n\n${data.passed ? 'Excellent work! You\'ve demonstrated a strong understanding of the material.' : 'You scored below the passing threshold (70%). We encourage you to review the lesson material and try again.'}\n\nBest regards,\nFuture Stars FC Education Team`
  };

  return sendEmail(parentEmail, template);
}
