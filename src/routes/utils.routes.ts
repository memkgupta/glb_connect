import { getSubjects, isUserNameValid, search } from "@controllers/utils.controller";
import { Router } from "express";

const router = Router()
router.get('/is-username-valid',isUserNameValid);
router.get('/subjects',getSubjects);
router.get('/search',search)
export default router