import express from 'express';
import ProjectController from './project.controller.js';
import jwtAuth from '../../middlewares/jwt.middleware.js';

const router = express.Router();


router.use(jwtAuth);


router.get('/', ProjectController.getProjects);


router.get('/:id', ProjectController.getProject);


router.post('/', ProjectController.createProject);


router.put('/:id', ProjectController.updateProject);


router.delete('/:id', ProjectController.deleteProject);


router.post('/:id/members', ProjectController.addMember);


router.delete('/:id/members', ProjectController.removeMember);


router.post('/:id/invite', ProjectController.inviteMember);

export default router;


