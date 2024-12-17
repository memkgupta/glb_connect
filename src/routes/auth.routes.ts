import { login, refreshToken, signUp, update, verify } from "@controllers/auth.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post('/sign-up',signUp);
router.post('/login',login);
router.put('/update',authenticate,update)
router.put('/verify',verify)
router.get('/refresh-token',refreshToken)
export default router