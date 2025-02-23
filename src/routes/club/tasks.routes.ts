import { assignTask, completeTask, deleteTask, getEventTasks, getMyTasks, getTaskById, updateTask } from "@controllers/club/tasks.controller";
import { authenticate, isClubAdmin, isClubMember } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

// router.get('/event',authenticate,isClubMember,getEventTasks)
router.get('/',authenticate,isClubMember,getMyTasks)
router.get('/:id',authenticate,isClubMember,getTaskById)
router.post('/assign',authenticate,isClubMember,assignTask)
router.put('/complete',authenticate,isClubMember,completeTask)
router.put('/update/:id',authenticate,isClubMember,updateTask)
router.delete('/:id',authenticate,isClubMember,deleteTask);
export default router;