import {  clubDashboard, getDashboardData, myClub, registerClub, updateClubDetails,  viewClub } from "@controllers/club.controller";
// import { getEvents } from "@controllers/club/events.controller";
import { addMember, getMemberById, getMembers, updateMember } from "@controllers/club/member.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.post('/register',authenticate,isClubAdmin,registerClub);
router.get('/dashboard',authenticate,isClubAdmin,getDashboardData);
router.put('/update',authenticate,isClubAdmin,updateClubDetails);

router.get('/my-club',authenticate,myClub)
router.get('/view/:id',viewClub);
router.get('/details',authenticate,isClubAdmin,clubDashboard)
// router.get('/events',authenticate,isClubAdmin,get)
export default router;