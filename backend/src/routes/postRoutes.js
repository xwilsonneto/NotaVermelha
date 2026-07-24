// backend/src/routes/postRoutes.js

const { Router } = require("express");
const {
  getPosts,
  createPost,
  deletePost,
  toggleLike,
  toggleRepost,
} = require("../controllers/postController");

const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

router.use(authMiddleware);

// Feed de posts com paginação: GET /api/posts?page=1&limit=20
router.get("/",            getPosts);
router.post("/",           createPost);
router.delete("/:id",      deletePost);
router.post("/:id/like",   toggleLike);
router.post("/:id/repost", toggleRepost);

module.exports = router;