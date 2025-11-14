import express from 'express';
import jwtAuth from '../../middlewares/jwt.middleware.js';
import CommentController from './comment.controller.js';

const router = express.Router();

router.use(jwtAuth);


router.get('/task/:taskId/comments', CommentController.list);
router.post('/task/:taskId/comments', CommentController.add);

router.delete('/comments/:commentId', CommentController.remove);

export default router;
