import { addAssignment, deleteAssignment, getRegistrationSubmissions, getTeamSubmissions, submitAssignment, updateAssignment } from "@controllers/events/assignment.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router()

router.post("/add-assignment",authenticate,addAssignment)
router.put("/update-assignment",authenticate,updateAssignment)
router.delete("/delete-assignment",authenticate,deleteAssignment)
router.post("/submit",authenticate,submitAssignment)
router.get("/team-submissions",authenticate,getTeamSubmissions)
router.get("/registration-submissions",authenticate,getRegistrationSubmissions)
export default router;