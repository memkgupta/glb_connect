import { getMyContributions } from "@controllers/resource.controller";
import { getMyProjects, getUserByUsername, getUserContributions, getUserProjects } from "@controllers/user.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.get('/',getUserByUsername);
router.get('/projects',getUserProjects)
router.get('/contributions',getUserContributions)
router.get('/my-projects',authenticate,getMyProjects)
router.get('/my-contributions',authenticate,getMyContributions)
export default router;