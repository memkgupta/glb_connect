import { addMember, getMemberById, getMembers, updateMember } from "@controllers/club/member.controller";
import { getTeams } from "@controllers/club/team.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get("/",authenticate,isClubAdmin,getTeams);
router.get('/members',authenticate,isClubAdmin,getMembers)
router.get(`/members/view`,authenticate,isClubAdmin,getMemberById)
router.post('/members/add',authenticate,isClubAdmin,addMember);
router.put('/members/update',authenticate,isClubAdmin,updateMember);
export default router;