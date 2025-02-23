import { addFormToEvent, getEventForms, getFormById, getFormResponseById, getFormResponses, toggleHideForm, updateForm } from "@controllers/club/form.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get("/",authenticate,isClubAdmin,getEventForms)
router.get("/:fid",authenticate,isClubAdmin,getFormById)
router.post("/add",authenticate,isClubAdmin,addFormToEvent)
router.put("/update",authenticate,isClubAdmin,updateForm)
router.put("/toggle-enable",authenticate,isClubAdmin,toggleHideForm)
router.get("/responses",authenticate,isClubAdmin,getFormResponses);
router.get("/responses/:sid",authenticate,isClubAdmin,getFormResponseById)
export default router;