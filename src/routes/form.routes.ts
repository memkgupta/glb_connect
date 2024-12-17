import { addFormToEvent, fillRegistrationForm, updateForm } from "@controllers/event.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.post('/fill-form',authenticate,fillRegistrationForm);
router.post('/add-form',authenticate,addFormToEvent);
router.put('/update-form',authenticate,updateForm);
export default router;