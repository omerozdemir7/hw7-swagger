import nodemailer from 'nodemailer';
import { env } from './env.js';

export const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port: Number(env('SMTP_PORT')),
    auth: {
      user: env('SMTP_USER'),
      pass: env('SMTP_PASSWORD'),
    },
  });

  const emailOptions = {
    from: env('SMTP_FROM'), // Gönderen adresi env'den al
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  await transporter.sendMail(emailOptions);
};