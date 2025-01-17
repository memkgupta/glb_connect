import { addContributor, createProject, getProjectById, getProjectLogs, getProjects, postVote, removeContributor, removeProject, updateProject } from "@controllers/project.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post('/create',authenticate,createProject);
router.put('/update',authenticate,updateProject);
router.delete('/delete',authenticate,removeProject);
router.post('/vote',authenticate,postVote)
router.get('/',getProjects);
router.get('/logs',getProjectLogs);
router.get('/view',getProjectById)
router.put('/contributor/add',authenticate,addContributor)
router.put('/contributor/remove',authenticate,removeContributor)

export default router