
import { getEventTasks } from "@controllers/club/tasks.controller";
import { attachRegistrationForm, createEvent, fetchFeedbacks, getAnalytics, getCreatedEvents, getEventDashboardById, getEventRegistrations, togglePublish, updateEventDetails } from "@controllers/events/admin.controller";
import { approveTeam, getTeamDetails, getTeams, viewRegistrationById } from "@controllers/events/registration.controller";
import { authenticate, isClubAdmin, isClubMember, isTeamLead } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.get("/",authenticate,getCreatedEvents);



router.post('/add-event',authenticate,createEvent);
router.get('/feedbacks',authenticate,fetchFeedbacks);
router.get('/admin/analytics',authenticate,getAnalytics)
// fetching the registrations for the particular event 
router.get('/registrations',authenticate,getEventRegistrations);
router.put('/:id',authenticate,updateEventDetails)

// fetching the dashboard data for particular event
router.get('/dashboard/:id',authenticate,getEventDashboardById);

router.get('/all',authenticate,getCreatedEvents)
// fetching the registration for a event with id
router.get("/registrations/:id",authenticate,isClubAdmin,viewRegistrationById)
// router.put("/attach-registration-form",authenticate,attachRegistrationForm)
router.get("/teams",authenticate,getTeams)
router.patch("/approve-team",authenticate,approveTeam)
router.get("/teams/:tid",authenticate,getTeamDetails)
export default router;