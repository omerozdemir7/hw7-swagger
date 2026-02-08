import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js';
import { env } from '../utils/env.js';
import * as authService from '../services/auth.js'; // Yeni servisin
import { randomBytes } from 'crypto';

// --- YARDIMCI FONKSİYONLAR ---
const setupSession = async (res, session) => {
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
  });
  
  res.cookie('sessionId', session._id, {
    httpOnly: true,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};

// --- CONTROLLER FONKSİYONLARI ---

// 1. KAYIT OLMA (REGISTER)
export const registerController = async (req, res) => {
  const { email,password, name } = req.body;
  const user = await UsersCollection.findOne({ email });
  if (user) {
    throw createHttpError(409, 'Email in use');
  }
  
  const encryptedPassword = await bcrypt.hash(password, 10);
  
  const newUser = await UsersCollection.create({
    name,
    email,
    password: encryptedPassword,
  });

  res.status(201).json({
    status: 201,
    message: 'Successfully registered a user!',
    data: newUser,
  });
};

// 2. GİRİŞ YAPMA (LOGIN) - HATA VEREN KISIM BURASIYDI
export const loginController = async (req, res) => {
  const { email, password } = req.body;
  const user = await UsersCollection.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Email or password invalid');
  }

  const isEqual = await bcrypt.compare(password, user.password);
  if (!isEqual) {
    throw createHttpError(401, 'Email or password invalid');
  }

  // Oturum oluştur
  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  const session = await SessionsCollection.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 dk
    refreshTokenValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
  });

  setupSession(res, session);

  res.json({
    status: 200,
    message: 'Successfully logged in an user!',
    data: { accessToken },
  });
};

// 3. ÇIKIŞ YAPMA (LOGOUT)
export const logoutController = async (req, res) => {
  if (req.cookies.sessionId) {
    await SessionsCollection.deleteOne({ _id: req.cookies.sessionId });
  }
  res.clearCookie('sessionId');
  res.clearCookie('refreshToken');
  res.status(204).send();
};

// 4. OTURUM YENİLEME (REFRESH)
export const refreshUserSessionController = async (req, res) => {
  const { sessionId, refreshToken } = req.cookies;
  const session = await SessionsCollection.findOne({ _id: sessionId, refreshToken });
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }
  
  const isSessionExpired = new Date() > new Date(session.refreshTokenValidUntil);
  if (isSessionExpired) {
    throw createHttpError(401, 'Session token expired');
  }

  // Yeni tokenlar
  const newAccessToken = randomBytes(30).toString('base64');
  const newRefreshToken = randomBytes(30).toString('base64');

  await SessionsCollection.deleteOne({ _id: sessionId });

  const newSession = await SessionsCollection.create({
    userId: session.userId,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenValidUntil: new Date(Date.now() + 15 * 60 * 1000),
    refreshTokenValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  setupSession(res, newSession);

  res.json({
    status: 200,
    message: 'Successfully refreshed a session!',
    data: { accessToken: newAccessToken },
  });
};

// 5. ŞİFRE SIFIRLAMA MAİLİ GÖNDERME (YENİ)
export const sendResetEmailController = async (req, res) => {
  const { email } = req.body;
  await authService.sendResetPasswordEmail(email); // Service'i kullanıyor
  res.json({
    status: 200,
    message: 'Reset password email has been successfully sent.',
    data: {},
  });
};

// 6. ŞİFRE SIFIRLAMA (YENİ)
export const resetPasswordController = async (req, res) => {
  await authService.resetPassword(req.body); // Service'i kullanıyor
  res.json({
    status: 200,
    message: 'Password has been successfully reset.',
    data: {},
  });
};