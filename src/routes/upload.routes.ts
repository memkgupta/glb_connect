import { getDocument, getUpload, startUpload } from "@controllers/upload.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/start",authenticate,startUpload);
// router.get("/protected/get",,getUpload)
router.get("/public/get",getUpload);
router.get("/public/document/get",getDocument);
router.get("/redirect",(req,res,next)=>{
    res.redirect(req.query.src as string);
})
export default router;