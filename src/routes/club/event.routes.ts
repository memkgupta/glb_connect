import { addEvent, fetchFeedbacks, getAdminEvents, getAnalytics, getEventRegistrations,  getRegistrations, getTeamLeadEvents, getTeamMemberEvents, updateEvent, verifyPass, viewRegistrationById } from "@controllers/club/events.controller";
import { getEventTasks } from "@controllers/club/tasks.controller";
import { getEventDashboardById } from "@controllers/event.controller";
import { authenticate, isClubAdmin, isClubMember, isTeamLead } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.get("/",authenticate,isClubAdmin,getAdminEvents);
router.get("/member",authenticate,isClubMember,getTeamMemberEvents)
router.get("/lead",authenticate,isTeamLead,getTeamLeadEvents)

router.get('/tasks',authenticate,isClubMember,getEventTasks);
router.post('/add-event',authenticate,addEvent);
router.get('/feedbacks',authenticate,fetchFeedbacks);
router.get('/admin/analytics',authenticate,getAnalytics)
// fetching the registrations for the particular event 
router.get('/registrations',authenticate,isClubAdmin,getEventRegistrations);
router.put('/:id',authenticate,updateEvent)
router.put('/verify-pass',authenticate,verifyPass);
// fetching the dashboard data for particular event
router.get('/dashboard/:id',authenticate,isClubMember,getEventDashboardById);


// fetching the registration for a event with id
router.get("/registrations/:id",authenticate,isClubAdmin,viewRegistrationById)
export default router;