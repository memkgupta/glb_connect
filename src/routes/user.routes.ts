import { update } from "@controllers/auth.controller";
import { getMyContributions } from "@controllers/resource.controller";
import { getDashboard, getFeed, getMyProjects, getRecentActivity, getUserByUsername, getUserContributions, getUserProjects } from "@controllers/user.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.get('/',getUserByUsername);
router.get("/update",update)
router.get('/projects',getUserProjects)
router.get('/contributions',getUserContributions)
router.get('/my-projects',authenticate,getMyProjects)
router.get('/saved-resources',authenticate,)
router.get('/my-contributions',authenticate,getMyContributions)
router.get("/feed",authenticate,getFeed);
router.get("/dashboard",authenticate,getDashboard);
router.get("/dashboard/activities",authenticate,getRecentActivity)
export default router;