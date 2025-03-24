import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

let transporter: nodemailer.Transporter;

/**
 * Creates and initializes email transporter
 * Uses SMTP settings from environment variables or creates a test account if not provided
 */
async function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === `true`,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('Using provided SMTP settings');
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Using Ethereal test account for email');
  }
}

/**
 * Prepares sender information based on environment settings
 * @returns Sender information for email headers
 */
function getSenderInfo() {
  const appName = process.env.APP_NAME || 'Booking CRM';
  const senderEmail = process.env.SMTP_USER || 'no-reply@booking-crm.com';
  return {
    name: appName,
    email: senderEmail,
    formatted: `"${appName}" <${senderEmail}>`
  };
}

/**
 * Send a password reset email with reset link
 * @param recipientEmail Email of the recipient
 * @param token Password reset token
 */
export async function sendPasswordResetEmail(recipientEmail: string, token: string) {
  if (!transporter) {
    await createTransporter();
  }

  const appDomain = process.env.APP_DOMAIN || 'http://18.153.95.5:3000';
  const resetUrl = `${appDomain}/reset-password?token=${token}`;
  const sender = getSenderInfo();

  const mailOptions = {
    from: sender.formatted,
    to: recipientEmail,
    subject: 'Password Reset',
    text: `To reset your password, please follow this link: ${resetUrl}`,
    html: `<p>To reset your password, please click on this link: <a href="${resetUrl}">${resetUrl}</a></p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);

    // If using Ethereal test account, get preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Email preview: %s', previewUrl);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

/**
 * Send an appointment confirmation email
 * @param recipientEmail Email of the recipient
 * @param appointmentData Appointment details
 */
export async function sendAppointmentConfirmationEmail(
  recipientEmail: string,
  appointmentData: {
    date: string;
    time: string;
    service?: string;
    specialist?: string;
    location?: string;
  }
) {
  if (!transporter) {
    await createTransporter();
  }

  const { date, time, service = "", specialist = "", location = "" } = appointmentData;
  const sender = getSenderInfo();

  const mailOptions = {
    from: sender.formatted,
    to: recipientEmail,
    subject: 'Appointment Confirmation',
    text:
      `Your appointment has been confirmed!\n\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n` +
      (service ? `Service: ${service}\n` : '') +
      (specialist ? `Specialist: ${specialist}\n` : '') +
      (location ? `Location: ${location}\n` : '') +
      `\nThank you for choosing our service!`,
    html:
      `<h2>Your appointment has been confirmed!</h2>` +
      `<p><strong>Date:</strong> ${date}</p>` +
      `<p><strong>Time:</strong> ${time}</p>` +
      (service ? `<p><strong>Service:</strong> ${service}</p>` : '') +
      (specialist ? `<p><strong>Specialist:</strong> ${specialist}</p>` : '') +
      (location ? `<p><strong>Location:</strong> ${location}</p>` : '') +
      `<p>Thank you for choosing our service!</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Appointment confirmation email sent: %s', info.messageId);

    // If using Ethereal test account, get preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Email preview: %s', previewUrl);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    return { success: false, error };
  }
}
