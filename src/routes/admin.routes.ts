import { addSubjects, banUser, dashboard, deleteUser, getResources,editAnnoucement, editSubject, getSubjectById, getUserById, getUsers, makeAnnouncement, removeContribution, removeSubject, unbanUser, getAnnouncements } from "@controllers/admin.controller";

import { getSubjects } from "@controllers/utils.controller";
import { Router } from "express";

const router =  Router();

router.get("/dashboard",dashboard)
router.get("/users",getUsers)
router.get("/users/:uid",getUserById)
router.put("/user/ban",banUser)
router.put("/user/unban",unbanUser)
router.delete("/user/:uid",deleteUser)
router.get("/resources",getResources)
router.delete("/resources/:rid",removeContribution)
router.get("/announcements",getAnnouncements);
router.post("/announcements",makeAnnouncement)
router.put("/announcements/:id",editAnnoucement)
router.post("/subjects",addSubjects)
router.put("/subjects/:id",editSubject)
router.delete("/subjects/:id",removeSubject)
router.get("/subjects/:id",getSubjectById)
router.get("/subjects",getSubjects)

export default router;