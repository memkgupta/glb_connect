
import { getEventById, getEvents } from "@controllers/events/event.controller";
import { createTeam, getMyRegistrations, getMyRegistrationStatus, getMyTeamDetails, giveFeedback, isRegistered, joinTeam, registerForEvent, submitTeamForReview } from "@controllers/events/registration.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get('/status',authenticate,getMyRegistrationStatus);
router.get('/is-registered',authenticate,isRegistered)
router.post('/register',authenticate,registerForEvent)
router.get("/team-details",authenticate,getMyTeamDetails);
router.post("/create-team",authenticate,createTeam)
router.post("/join-team",authenticate,joinTeam)
router.post('/feedback',authenticate,giveFeedback);
router.post("/submit-team",authenticate,submitTeamForReview)
router.get("/my-registrations",authenticate,getMyRegistrations)
export default router;