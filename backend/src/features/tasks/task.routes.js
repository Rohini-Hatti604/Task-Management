import express from 'express';
import TaskController from './task.controller.js';
import jwtAuth from '../../middlewares/jwt.middleware.js';
import multer from 'multer';
import path from 'path';

const taskRoute = express.Router();
const taskController = new TaskController();

// All task routes require authentication
taskRoute.use(jwtAuth);

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_\.]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage });

// Attachments routes (declare before generic parameter routes)
taskRoute.get('/:taskId/attachments', taskController.listAttachments);
taskRoute.post('/:taskId/attachments', upload.single('file'), taskController.addAttachment);
taskRoute.delete('/:taskId/attachments/:attachmentId', taskController.deleteAttachment);

taskRoute.get('/:section', taskController.getTasks);
taskRoute.post('/', taskController.addTask);
taskRoute.put('/:taskId', taskController.updateTask);
taskRoute.delete('/:taskId', taskController.deleteTask);
taskRoute.patch('/move', taskController.moveTask);

export default taskRoute;
