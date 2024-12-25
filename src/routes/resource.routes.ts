import { getMyContributions, getResourceById, getResources, postVote, uploadBulkResource, uploadResource } from "@controllers/resource.controller";
import { authenticate, optionalAuth } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.post('/upload-resource',authenticate,uploadResource);
router.get('/',getResources);
router.post('/vote',authenticate,postVote);
router.get('/view/:id',optionalAuth,getResourceById);
router.get('/my-contributions',authenticate,getMyContributions)
router.get('/upload-bulk',authenticate,uploadBulkResource);
export default router;