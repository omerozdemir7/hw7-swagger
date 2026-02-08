import { Router } from 'express';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { validateBody } from '../middlewares/validateBody.js';
import { 
  registerUserSchema, 
  loginUserSchema, 
  sendResetEmailSchema, // validateBody şemasını import et
  resetPasswordSchema   // validateBody şemasını import et
} from '../validation/auth.js'; 

import { 
  registerController, 
  loginController, 
  logoutController, 
  refreshUserSessionController,
  sendResetEmailController, // Yeni eklediğimiz controller
  resetPasswordController   // Yeni eklediğimiz controller
} from '../controllers/auth.js';

const router = Router();

// Mevcut rotaların...
router.post('/register', validateBody(registerUserSchema), ctrlWrapper(registerController));
router.post('/login', validateBody(loginUserSchema), ctrlWrapper(loginController));
// ... diğer rotalar

// --- YENİ EKLENECEK KISIMLAR ---

// Şifre sıfırlama maili gönderme rotası
router.post(
  '/send-reset-email',
  validateBody(sendResetEmailSchema),
  ctrlWrapper(sendResetEmailController),
);

// Şifreyi sıfırlama rotası
router.post(
  '/reset-pwd',
  validateBody(resetPasswordSchema),
  ctrlWrapper(resetPasswordController),
);

export default router;