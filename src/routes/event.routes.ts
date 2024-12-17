import { addEvent, fetchFeedbacks, getEventById, getEventDashboardById, getEvents, getRegistrations, giveFeedback, registerForEvent, updateEvent, verifyPass, viewRegistrationById } from "@controllers/event.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.get('/',getEvents);
router.get('/dashboard/:id',authenticate,getEventDashboardById);
router.post('/add-event',authenticate,addEvent);
router.put('/:id',authenticate,updateEvent)
router.get('/registrations',authenticate,getRegistrations);
router.get('/:id',getEventById);
router.post('/register',authenticate,registerForEvent)
router.get('/registrations/:id',authenticate,viewRegistrationById);
router.post('/feedback',authenticate,giveFeedback);
router.get('/feedbacks',authenticate,fetchFeedbacks);
router.put('/verify-pass',authenticate,verifyPass);
export default router;