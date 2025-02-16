import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

let transporter: nodemailer.Transporter;

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
    console.log('Используем указанные SMTP-настройки');
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
    console.log('Используем тестовый аккаунт Ethereal');
  }
}

/**
 * Функция для отправки письма со ссылкой для сброса пароля.
 * @param recipientEmail Email получателя
 * @param token Токен для сброса пароля
 */
export async function sendPasswordResetEmail(recipientEmail: string, token: string) {
  if (!transporter) {
    await createTransporter();
  }

  const resetUrl = `https://yourapp.com/reset-password?token=${token}`;
  const mailOptions = {
    from: `"YourApp" <no-reply@yourapp.com>`,
    to: recipientEmail,
    subject: 'Сброс пароля',
    text: `Для сброса пароля перейдите по ссылке: ${resetUrl}`,
    html: `<p>Для сброса пароля перейдите по ссылке: <a href="${resetUrl}">${resetUrl}</a></p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Письмо отправлено: %s', info.messageId);

    // Если используется Ethereal, можно получить ссылку для предпросмотра письма:
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Предпросмотр письма: %s', previewUrl);
    }
  } catch (error) {
    console.error('Ошибка отправки письма:', error);
  }
}
