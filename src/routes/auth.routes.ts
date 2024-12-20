import { login, logout, me, refreshToken, session, signUp, update, verify } from "@controllers/auth.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post('/sign-up',signUp);
router.post('/login',login);
router.put('/update',authenticate,update)
router.put('/verify',verify)
router.post('/refresh-token',refreshToken)
router.post('/logout',authenticate,logout)
router.get('/session',authenticate,session)
router.get('/me',authenticate,me)
export default router