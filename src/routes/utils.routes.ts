import { getSubjects, isUserNameValid, search } from "@controllers/utils.controller";
import { Router } from "express";

const router = Router()
router.get('/username-valid-check',isUserNameValid);
router.get('/subjects',getSubjects);
router.get('/search',search)
export default router