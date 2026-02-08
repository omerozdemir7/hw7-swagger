// src/services/auth.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js';
import { env } from '../utils/env.js';
import { sendEmail } from '../utils/sendEmail.js';

export const sendResetPasswordEmail = async (email) => {
  const user = await UsersCollection.findOne({ email });
  if (!user) {
    throw createHttpError(404, 'User not found!');
  }

  const token = jwt.sign(
    {
      sub: user._id,
      email: user.email,
    },
    env('JWT_SECRET'),
    { expiresIn: '5m' },
  );

  const resetLink = `${env('APP_DOMAIN')}/reset-password?token=${token}`;

  try {
    await sendEmail({
      to: email,
      subject: 'Reset your password',
      html: `<h1>Password Reset</h1>
             <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
             <p>This link expires in 5 minutes.</p>`,
      text: `Click here to reset your password: ${resetLink}`,
    });
  } catch (err) {
    console.error('Email gönderim hatası:', err); // Hata detayını görmek için
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  }
};

export const resetPassword = async (payload) => {
  const { token, password } = payload;
  let decoded;

  try {
    decoded = jwt.verify(token, env('JWT_SECRET'));
  } catch (err) {
    throw createHttpError(401, 'Token is expired or invalid.');
  }

  const user = await UsersCollection.findOne({ email: decoded.email });
  if (!user) {
    throw createHttpError(404, 'User not found!');
  }

  const encryptedPassword = await bcrypt.hash(password, 10);

  await UsersCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
  );

  // Kullanıcının tüm oturumlarını kapat
  await SessionsCollection.deleteMany({ userId: user._id });
};