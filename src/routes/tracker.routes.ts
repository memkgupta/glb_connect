import { getCourses, getProgress, getTracker, startTracker, updateProgress } from "@controllers/tracker.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.get('/',authenticate,getTracker)
router.post('/',authenticate,startTracker)
router.get('/progress',authenticate,getProgress);
router.get('/courses',authenticate,getCourses);
router.put('/',authenticate,updateProgress)
export default router;