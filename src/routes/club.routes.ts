import {  getDashboardData, myClub, registerClub, updateClubDetails,  viewClub } from "@controllers/club.controller";
import { getEvents } from "@controllers/club/events.controller";
import { addMember, getMemberById, getMembers, updateMember } from "@controllers/club/member.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.post('/register',authenticate,isClubAdmin,registerClub);
router.get('/dashboard',authenticate,isClubAdmin,getDashboardData);
router.get('/dashboard/events',authenticate,isClubAdmin,getEvents)
router.put('/update',authenticate,isClubAdmin,updateClubDetails);
router.get('/members',authenticate,isClubAdmin,getMembers)
router.get(`/members/view`,authenticate,isClubAdmin,getMemberById)
router.post('/members/add',authenticate,isClubAdmin,addMember);
router.put('/members/update',authenticate,isClubAdmin,updateMember);
router.get('/my-club',authenticate,myClub)
router.get('/view/:id',viewClub);
export default router;