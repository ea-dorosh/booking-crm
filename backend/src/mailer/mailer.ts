import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { CompanyResponseData } from '@/@types/companyTypes.js';

dotenv.config();

let transporter: nodemailer.Transporter;

// Register helper for comparing values
Handlebars.registerHelper(`eq`, function(this: unknown, arg1: unknown, arg2: unknown, options: Handlebars.HelperOptions) {
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
    console.log(`Using provided SMTP settings`);
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
    console.log(`Using Ethereal test account for email`);
  }
}

function getSenderInfo() {
  const appName = process.env.APP_NAME || `Mood Beauty`;
  const senderEmail = process.env.SMTP_USER || `moodbeady.de@gmail.com`;
  return {
    name: appName,
    email: senderEmail,
    formatted: `"${appName}" <${senderEmail}>`,
  };
}

function renderTemplate(templateName: string, context: Record<string, any>): string {
  try {
    const RESOURCES_PATH = process.env.RESOURCES_PATH || path.join(process.cwd(), `resources`);
    const templatePath = path.join(RESOURCES_PATH, `templates`, `emails`, `${templateName}.html`);

    const source = fs.readFileSync(templatePath, `utf8`);
    const template = Handlebars.compile(source);
    return template(context);
  } catch (error) {
    console.error(`Error rendering template ${templateName}:`, error);
    throw new Error(`Failed to render template ${templateName}`);
  }
}

export async function sendPasswordResetEmail(recipientEmail: string, token: string) {
  if (!transporter) {
    await createTransporter();
  }

  const appDomain = process.env.APP_DOMAIN || `http://18.153.95.5:3000`;
  const resetUrl = `${appDomain}/reset-password?token=${token}`;
  const sender = getSenderInfo();

  const htmlContent = renderTemplate(`password-reset`, { resetUrl });

  const mailOptions = {
    from: sender.formatted,
    to: recipientEmail,
    subject: `Passwort zurücksetzen - Dorosh Studio`,
    text: `Um Ihr Passwort zurückzusetzen, klicken Sie bitte auf diesen Link: ${resetUrl}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent: %s`, info.messageId);

    // If using Ethereal test account, get preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email preview: %s`, previewUrl);
    }

    return {
      success: true, messageId: info.messageId, previewUrl,
    };
  } catch (error) {
    console.error(`Error sending password reset email:`, error);
    return {
      success: false, error,
    };
  }
}

export async function sendAppointmentConfirmationEmail({
  recipientEmail,
  appointmentData,
  firstServiceData,
  secondServiceData,
  companyData,
}: {
    recipientEmail: string,
    appointmentData: {
      location: string,
      lastName: string,
      firstName: string,
      phone: string | null,
      email: string,
    },
    firstServiceData: {
      date: string;
      time: string;
      service: string;
      specialist: string;
    },
    secondServiceData?: {
      date: string;
      time: string;
      service: string;
      specialist: string;
    },
    companyData: CompanyResponseData,
  },
) {
  if (!transporter) {
    await createTransporter();
  }

  const {
    location,
    lastName,
    firstName,
    phone,
    email,
  } = appointmentData;

  const sender = getSenderInfo();

  const templateContext: any = {
    lastName,
    firstName,
    location,
    phone,
    email,
    companyData: companyData,
    currentYear: new Date().getFullYear(),
    firstServiceData: firstServiceData,
  };

  if (secondServiceData) {
    templateContext.secondServiceData = secondServiceData;
  }

  const htmlContent = renderTemplate(`appointment-confirmation`, templateContext);

  console.log(`templateContext: `, JSON.stringify(templateContext, null, 4));

  const mailOptions = {
    from: sender.formatted,
    to: recipientEmail,
    subject: `Terminbestätigung - MOOD BEAUTY`,
    text:
      `MOOD BEAUTY\n\n` +
      `Vielen Dank für die Buchung\n\n` +
      `Hallo ${firstName} ${lastName},\n` +
      `die Buchung für "${firstServiceData.service}" ist bestätigt. Für Fragen stehen wir jederzeit zur Verfügung.\n\n` +
      `Ihre Terminbestätigung\n` +
      `---------------------\n` +
      `Datum: ${firstServiceData.date} um ${firstServiceData.time} Uhr\n` +
      `Service: ${firstServiceData.service}\n` +
      `Standort: ${location}\n` +
      `Spezialist: ${firstServiceData.specialist}\n\n` +
      `Kundenangaben\n` +
      `-------------\n` +
      `Name: ${firstName} ${lastName}\n` +
      `Telefonnummer: ${phone || `Keine Angabe`}\n` +
      `Email: ${email}\n\n` +
      `MOOD BEAUTY\n` +
      `${location}\n\n` +
      `${companyData.name}\n` +
      `Telefonnummer: ${companyData.phone}\n` +
      `E-Mail: ${companyData.email}\n` +
      `Website: ${companyData.website}\n` +
      `${companyData.addressStreet}, ${companyData.addressZip} ${companyData.addressCity}, ${companyData.addressCountry}\n\n` +
      `© ${new Date().getFullYear()} Natalia Dorosh. Alle Rechte vorbehalten.`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Appointment confirmation email sent: %s`, info.messageId, info.envelope);

    // If using Ethereal test account, get preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email preview: %s`, previewUrl);
    }

    return {
      success: true, messageId: info.messageId, previewUrl,
    };
  } catch (error) {
    console.error(`Error sending appointment confirmation email:`, error);
    return {
      success: false, error,
    };
  }
}

export async function sendAppointmentNotificationEmail({
  recipientEmail,
  appointmentData,
  firstServiceData,
  secondServiceData,
  companyData,
}: {
    recipientEmail: string,
    appointmentData: {
      location: string,
      lastName: string,
      firstName: string,
      phone: string | null,
      email: string,
      isCustomerNew: boolean,
    },
    firstServiceData: {
      date: string;
      time: string;
      service: string;
      specialist: string;
    },
    secondServiceData?: {
      date: string;
      time: string;
      service: string;
      specialist: string;
    },
    companyData: CompanyResponseData,
  },
) {
  if (!transporter) {
    await createTransporter();
  }

  const {
    location,
    lastName,
    firstName,
    phone,
    email,
    isCustomerNew,
  } = appointmentData;

  const sender = getSenderInfo();
  const currentTime = new Date();

  const templateContext: any = {
    lastName,
    firstName,
    location,
    phone: phone || `Keine Angabe`,
    email,
    isCustomerNew,
    companyData: companyData,
    currentYear: currentTime.getFullYear(),
    bookingTime: currentTime.toLocaleString(`de-DE`, {
      timeZone: `Europe/Berlin`,
      day: `2-digit`,
      month: `2-digit`,
      year: `numeric`,
      hour: `2-digit`,
      minute: `2-digit`,
    }),
    firstServiceData: firstServiceData,
  };

  if (secondServiceData) {
    templateContext.secondServiceData = secondServiceData;
  }

  const htmlContent = renderTemplate(`appointment-notification`, templateContext);

  const subjectText = secondServiceData
    ? `Neue Buchung: 2 Termine für ${firstName} ${lastName}`
    : `Neue Buchung: ${firstServiceData.service} für ${firstName} ${lastName}`;

  const textContent = secondServiceData
    ? `Neue Terminbuchung erhalten!\n\n` +
      `Kunde: ${firstName} ${lastName}\n` +
      `Email: ${email}\n` +
      `Telefon: ${phone || `Keine Angabe`}\n` +
      `Kundenstatus: ${isCustomerNew ? `Neukunde` : `Bestandskunde`}\n\n` +
      `Erster Termin:\n` +
      `${firstServiceData.date} um ${firstServiceData.time} Uhr\n` +
      `Service: ${firstServiceData.service}\n` +
      `Spezialist: ${firstServiceData.specialist}\n\n` +
      `Zweiter Termin:\n` +
      `${secondServiceData.date} um ${secondServiceData.time} Uhr\n` +
      `Service: ${secondServiceData.service}\n` +
      `Spezialist: ${secondServiceData.specialist}\n\n` +
      `Standort: ${location}\n\n` +
      `Diese Benachrichtigung wurde automatisch generiert.`
    : `Neue Terminbuchung erhalten!\n\n` +
      `Kunde: ${firstName} ${lastName}\n` +
      `Email: ${email}\n` +
      `Telefon: ${phone || `Keine Angabe`}\n` +
      `Kundenstatus: ${isCustomerNew ? `Neukunde` : `Bestandskunde`}\n\n` +
      `Termin: ${firstServiceData.date} um ${firstServiceData.time} Uhr\n` +
      `Service: ${firstServiceData.service}\n` +
      `Spezialist: ${firstServiceData.specialist}\n` +
      `Standort: ${location}\n\n` +
      `Diese Benachrichtigung wurde automatisch generiert.`;

  const mailOptions = {
    from: sender.formatted,
    to: recipientEmail,
    subject: subjectText,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Appointment notification email sent to salon: %s`, info.messageId, info.envelope);

    // If using Ethereal test account, get preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email preview: %s`, previewUrl);
    }

    return {
      success: true, messageId: info.messageId, previewUrl,
    };
  } catch (error) {
    console.error(`Error sending appointment notification email:`, error);
    return {
      success: false, error,
    };
  }
}

export async function sendGoogleCalendarReconnectEmail(
  recipientEmail: string,
  userData: {
    userName: string;
    calendarId: string;
    employeeId: number;
    expiredEmployees?: Array<{
      employeeId: number;
      name: string;
      calendarId: string;
    }>;
  },
) {
  if (!transporter) {
    await createTransporter();
  }

  const currentYear = new Date().getFullYear();
  const appDomain = process.env.APP_DOMAIN || `http://18.153.95.5:3000`;
  const crmLoginUrl = `${appDomain}`;
  const sender = getSenderInfo();

  const htmlContent = renderTemplate(`google-calendar-reconnect`, {
    ...userData,
    hasMultipleExpired: userData.expiredEmployees && userData.expiredEmployees.length > 0,
    currentYear,
    crmLoginUrl,
  });

  const mailOptions = {
    from: sender.formatted,
    to: recipientEmail,
    subject: `Требуется переподключение Google Calendar - Booking CRM`,
    text: userData.expiredEmployees && userData.expiredEmployees.length > 0
      ? `Здравствуйте, ${userData.userName}! Наша система обнаружила, что интеграция с Google Calendar истекла у ${userData.expiredEmployees.length} мастеров. Пожалуйста, войдите в CRM и переподключите Google Calendar для этих мастеров: ${crmLoginUrl}`
      : `Здравствуйте, ${userData.userName}! Наша система обнаружила, что интеграция вашего аккаунта с Google Calendar более не активна. Пожалуйста, войдите в CRM и переподключите ваш Google Calendar: ${crmLoginUrl}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Google Calendar reconnect email sent: %s`, info.messageId);

    // If using Ethereal test account, get preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email preview: %s`, previewUrl);
    }

    return {
      success: true, messageId: info.messageId, previewUrl,
    };
  } catch (error) {
    console.error(`Error sending Google Calendar reconnect email:`, error);
    return {
      success: false, error,
    };
  }
}
