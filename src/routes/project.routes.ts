import { addContributor, createProject, editContributor, getCollaborationRequestStatus, getCollabRequestById, getCollabRequests, getContributorById, getContributors, getProjectById, getProjectDashboard, getProjectLogs, getProjects, postVote, removeContributor, removeProject, sendCollabRequest, updateCollabRequest, updateProject } from "@controllers/project.controller";
import { authenticate, projectAuhtorize } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();
router.get('/',getProjects);
router.post('/create',authenticate,createProject);
router.put('/:pid',authenticate,projectAuhtorize,updateProject);
router.get('/view',getProjectById)
router.delete('/:pid',authenticate,projectAuhtorize,removeProject);
router.post('/analytics/vote',authenticate,postVote)
router.get('/:pid/dashboard',authenticate,projectAuhtorize,getProjectDashboard);
router.get('/:pid/logs',getProjectLogs);
router.put("/collaborate/requests/:id",authenticate,projectAuhtorize,updateCollabRequest)
router.get("/contributors/all",authenticate,projectAuhtorize,getContributors);
router.get("/contributors/view",authenticate,projectAuhtorize,getContributorById);
router.put('/contributors/add',authenticate,projectAuhtorize,addContributor)
router.put("/contributors/edit",authenticate,projectAuhtorize,editContributor)
router.put('/contributors/remove',authenticate,projectAuhtorize,removeContributor)
router.get('/collaborate/request/status/:id',authenticate,getCollaborationRequestStatus)
router.post('/collaborate/:id',authenticate,projectAuhtorize,sendCollabRequest)
router.get('/collaborate/requests',authenticate,projectAuhtorize,getCollabRequests)
router.get('/collaborate/requests/:id',authenticate,projectAuhtorize,getCollabRequestById)

export default router