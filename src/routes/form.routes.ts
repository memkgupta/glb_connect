import { addFormToEvent, fillRegistrationForm, getForm, getFormById, getFormResponseById, getFormResponses, updateForm } from "@controllers/event.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.post('/fill-form',authenticate,fillRegistrationForm);
router.get('/get-form',authenticate,getForm)
router.post('/add-form',authenticate,addFormToEvent);
router.put('/update-form',authenticate,updateForm);
router.get("/:fid",authenticate,getFormById);
router.get("/submissions/all",authenticate,getFormResponses)
router.get("/submissions/view",authenticate,getFormResponseById)
export default router;