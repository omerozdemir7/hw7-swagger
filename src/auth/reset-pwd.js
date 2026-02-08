// controllers/auth.js veya ilgili dosya içine
import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js';
import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const resetPasswordController = async (req, res) => { // İsmini projene göre uyarla
  const { token, password } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw createHttpError(401, 'Token is expired or invalid.');
  }

  const user = await UsersCollection.findOne({ email: decoded.email });
  if (!user) {
    throw createHttpError(404, 'User not found!');
  }

  const hashPassword = await bcrypt.hash(password, 10);

  // 1. Şifreyi güncelle
  await UsersCollection.findByIdAndUpdate(user._id, {
    password: hashPassword,
  });

  // 2. Bu kullanıcının TÜM oturumlarını sil (Böylece her yerden çıkış yapılır)
  await SessionsCollection.deleteMany({ userId: user._id });

  res.json({
    status: 200,
    message: "Password has been successfully reset.",
    data: {},
  });
};