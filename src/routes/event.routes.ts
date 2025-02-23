import { getEventRegistrations, viewRegistrationById} from "@controllers/club/events.controller";
import { getEventById, getEventDashboardById, getEvents, getRegistrationStatus, giveFeedback, isRegistered, registerForEvent,  } from "@controllers/event.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
// fetching all events for the users
router.get('/',getEvents);

// fetching the event by id for the user
router.get('/:id',getEventById);
// register for a event
router.post('/register',authenticate,registerForEvent)
// registration details for a user
router.get('/registrations/:id',authenticate,viewRegistrationById);
// api endpoint for giving feedback to a event if user registered
router.post('/feedback',authenticate,giveFeedback);
// geting registration status
router.get('/registration/status',authenticate,getRegistrationStatus);
router.get('/registration/is-registered',authenticate,isRegistered)

export default router;