import { attachRegistrationForm } from "@controllers/events/admin.controller";
import { addFormToEvent,  getEventForms,  getFormById, getFormResponseById, getFormResponses, toggleHideForm, updateForm } from "@controllers/form.controller";
import { authenticate, isClubAdmin } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();


router.get("/:fid",authenticate,getFormById)
router.get("/",authenticate,getEventForms)
router.post("/add",authenticate,addFormToEvent)
router.put("/attach-registration-form",authenticate,attachRegistrationForm)
router.put("/update",authenticate,updateForm)
router.put("/toggle-enable",authenticate,toggleHideForm)
router.get("/responses",authenticate,getFormResponses);
router.get("/responses/:sid",authenticate,getFormResponseById)
export default router;