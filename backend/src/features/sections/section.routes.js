import express from 'express';
import SectionController from './section.controller.js';
import jwtAuth from '../../middlewares/jwt.middleware.js';

const router = express.Router();


router.use(jwtAuth);

router.get('/', SectionController.getSections);
router.post('/', SectionController.addSection);
router.delete('/:id', SectionController.deleteSection);
router.put('/:id', SectionController.updateSection);

export default router;
