import { addMember, getDashboardData, myClub, registerClub, updateClubDetails, updateMember, viewClub } from "@controllers/club.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.post('/register',authenticate,registerClub);
router.get('/dashboard',authenticate,getDashboardData);
router.put('/update',authenticate,updateClubDetails);
router.post('/member/add',authenticate,addMember);
router.put('/member/update',authenticate,updateMember);
router.get('/my-club',authenticate,myClub)
router.get('/view/:id',viewClub);
export default router;