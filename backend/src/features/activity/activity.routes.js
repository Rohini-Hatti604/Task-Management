import express from 'express';
import jwtAuth from '../../middlewares/jwt.middleware.js';
import ActivityController from './activity.controller.js';

const router = express.Router();

router.use(jwtAuth);


router.get('/activity/task/:taskId', ActivityController.listByTask);

export default router;
