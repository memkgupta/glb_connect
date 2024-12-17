import { getMyContributions, getResourceById, getResources, postVote, uploadResource } from "@controllers/resource.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.post('/upload-resource',authenticate,uploadResource);
router.get('/',getResources);
router.post('/vote',postVote);
router.get('/view/:id',getResourceById);
router.get('/my-contributions',authenticate,getMyContributions)
export default router;