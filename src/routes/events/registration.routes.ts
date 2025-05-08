
import { getEventById, getEvents } from "@controllers/events/event.controller";
import { getMyRegistrationStatus, giveFeedback, isRegistered, registerForEvent } from "@controllers/events/registration.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get('/status',authenticate,getMyRegistrationStatus);
router.get('/is-registered',authenticate,isRegistered)
router.post('/register',authenticate,registerForEvent)

router.post('/feedback',authenticate,giveFeedback);
export default router;