
import { getEventTasks } from "@controllers/club/tasks.controller";
import { createEvent, fetchFeedbacks, getAnalytics, getCreatedEvents, getEventDashboardById, getEventRegistrations, updateEventDetails } from "@controllers/events/admin.controller";
import { viewRegistrationById } from "@controllers/events/registration.controller";
import { authenticate, isClubAdmin, isClubMember, isTeamLead } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.get("/",authenticate,getCreatedEvents);


router.get('/tasks',authenticate,isClubMember,getEventTasks);
router.post('/add-event',authenticate,createEvent);
router.get('/feedbacks',authenticate,fetchFeedbacks);
router.get('/admin/analytics',authenticate,getAnalytics)
// fetching the registrations for the particular event 
router.get('/registrations',authenticate,isClubAdmin,getEventRegistrations);
router.put('/:id',authenticate,updateEventDetails)

// fetching the dashboard data for particular event
router.get('/dashboard/:id',authenticate,isClubMember,getEventDashboardById);


// fetching the registration for a event with id
router.get("/registrations/:id",authenticate,isClubAdmin,viewRegistrationById)
export default router;