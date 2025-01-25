import { getUpload, startUpload } from "@controllers/upload.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/start",authenticate,startUpload);
// router.get("/protected/get",,getUpload)
router.get("/public/get",getUpload);

export default router;