import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

dotenv.config();

let transporter: nodemailer.Transporter;

// Register helper for comparing values
Handlebars.registerHelper('eq', function(this: unknown, arg1: unknown, arg2: unknown, options: Handlebars.HelperOptions) {
  return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
});

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
  const appName = process.env.APP_NAME || 'Dorosh Studio';
  const senderEmail = process.env.SMTP_USER || 'no-reply@dorosh-studio.com';
  return {
    name: appName,
    email: senderEmail,
    formatted: `"${appName}" <${senderEmail}>`
  };
}

/**
 * Render a template with context data using Handlebars
 * @param templateName Template file name without extension
 * @param context Data to be used in the template
 * @returns Rendered HTML string
 */
function renderTemplate(templateName: string, context: Record<string, any>): string {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'emails', `${templateName}.html`);
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(source);
    return template(context);
  } catch (error) {
    console.error(`Error rendering template ${templateName}:`, error);
    throw new Error(`Failed to render template ${templateName}`);
  }
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

  const htmlContent = renderTemplate('password-reset', { resetUrl });

  const mailOptions = {
    from: sender.formatted,
    to: recipientEmail,
    subject: 'Passwort zurücksetzen - Dorosh Studio',
    text: `Um Ihr Passwort zurückzusetzen, klicken Sie bitte auf diesen Link: ${resetUrl}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent: %s', info.messageId);

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
    salutation?: string;
    lastName?: string;
  }
) {
  if (!transporter) {
    await createTransporter();
  }

  const {
    date,
    time,
    service = "",
    specialist = "",
    location = "Kastanienallee 22, Berlin",
    salutation = "female",
    lastName = ""
  } = appointmentData;

  const salutationText = salutation === 'male' ? 'geehrter Herr' : 'geehrte Frau';
  const sender = getSenderInfo();

  const templateContext = {
    salutationText,
    lastName,
    date,
    time,
    service,
    specialist,
    location
  };

  const htmlContent = renderTemplate('appointment-confirmation', templateContext);

  const mailOptions = {
    from: sender.formatted,
    to: recipientEmail,
    subject: 'Terminbestätigung - Dorosh Studio',
    text:
      `Terminbestätigung\n\n` +
      `Sehr ${salutationText} ${lastName},\n\n` +
      `vielen Dank für Ihre Buchung bei Dorosh Studio. Hiermit bestätigen wir Ihren Termin:\n\n` +
      `Datum: ${date}\n` +
      `Uhrzeit: ${time} Uhr\n` +
      (service ? `Behandlung: ${service}\n` : '') +
      (specialist ? `Stylist: ${specialist}\n` : '') +
      `Adresse: ${location}\n` +
      `\nFalls Sie Ihren Termin verschieben oder absagen möchten, kontaktieren Sie uns bitte mindestens 24 Stunden im Voraus.\n\n` +
      `Wir freuen uns auf Ihren Besuch!\n\n` +
      `Mit freundlichen Grüßen,\n` +
      `Ihr Dorosh Studio Team`,
    html: htmlContent,
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
