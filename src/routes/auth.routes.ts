import { login, logout, me, refreshToken, requestForgotPassword, resetPassword, session, signUp, update, verify } from "@controllers/auth.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post('/sign-up',signUp);
router.post('/login',login);
router.put('/update',authenticate,update)
router.post('/verify',verify)
router.post('/refresh-token',refreshToken)
router.post('/logout',authenticate,logout)
router.get('/session',authenticate,session)
router.get('/me',authenticate,me)
router.post('/forgot-password',requestForgotPassword);
router.post('/reset-password',resetPassword)
export default router