

import { getEventById, getEvents } from "@controllers/events/event.controller";
import { getMyRegistrationStatus, giveFeedback, isRegistered, registerForEvent } from "@controllers/events/registration.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
// fetching all events for the users
router.get('/',getEvents);

// fetching the event by id for the user
router.get('/:id',getEventById);
// register for a event


// geting registration status


export default router;