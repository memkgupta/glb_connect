import { addAssignment, deleteAssignment, getAssignmentById, getAssignments, getRegistrationSubmissions, getTeamSubmissions, submitAssignment, updateAssignment } from "@controllers/events/assignment.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router()

router.post("/add-assignment",authenticate,addAssignment)
router.put("/update-assignment",authenticate,updateAssignment)
router.delete("/delete-assignment",authenticate,deleteAssignment)
router.get("/",authenticate,getAssignments)
router.get("/view/:id",authenticate,getAssignmentById)
router.post("/submit",authenticate,submitAssignment)
router.get("/team-submissions",authenticate,getTeamSubmissions)
router.get("/registration-submissions",authenticate,getRegistrationSubmissions)
export default router;