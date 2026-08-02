import { Router } from "express";
import * as controller from "../controllers/product.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", requireAuth, requireAdmin, controller.list);

export default router;
