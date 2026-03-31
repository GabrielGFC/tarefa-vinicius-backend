import { Router } from "express";
import { createLog, listLogs } from "../controllers/logController.js";

const router = Router();

router.get("/", listLogs);
router.post("/", createLog);

export default router;
