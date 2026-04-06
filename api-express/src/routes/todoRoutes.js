import { Router } from "express";
import { createTodo, deleteTodo, listTodos, toggleTodo } from "../controllers/todoController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listTodos);
router.post("/", createTodo);
router.patch("/:id/toggle", toggleTodo);
router.delete("/:id", deleteTodo);

export default router;
