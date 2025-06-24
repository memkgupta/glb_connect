import { Express, Router } from "express";
import * as controller from "@controllers/announcement.controller"
import { authenticate, isAdmin } from "@middlewares/auth.middleware";
const router =Router();

router.post("/", authenticate,isAdmin, controller.create);
router.get("/", authenticate,controller.getAll);
router.get("/:id",authenticate,controller.getById);
router.put("/:id", authenticate, isAdmin,controller.update);
router.delete("/:id",authenticate, isAdmin,controller.remove);

export default router;