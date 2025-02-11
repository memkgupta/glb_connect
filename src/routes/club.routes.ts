import { addMember, getDashboardData, getEvents, getMembers, myClub, registerClub, updateClubDetails, updateMember, viewClub } from "@controllers/club.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.post('/register',authenticate,registerClub);
router.get('/dashboard',authenticate,getDashboardData);
router.get('/dashboard/events',authenticate,getEvents)
router.put('/update',authenticate,updateClubDetails);
router.get('/members',authenticate,getMembers)
router.post('/member/add',authenticate,addMember);
router.put('/member/update',authenticate,updateMember);
router.get('/my-club',authenticate,myClub)
router.get('/view/:id',viewClub);
export default router;