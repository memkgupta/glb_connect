import { fillRegistrationForm, getForm,} from "@controllers/event.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.post('/fill-form',authenticate,fillRegistrationForm);
router.get('/get-form',authenticate,getForm)
export default router;