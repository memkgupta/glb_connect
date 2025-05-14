
import { fillRegistrationForm, getForm } from "@controllers/events/registration.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
// add route for getting form by id and filling form by id
router.post('/fill-form',authenticate,fillRegistrationForm);
router.get('/get-form',authenticate,getForm)

export default router;