
import Section from './section.model.js';

import Project from '../projects/project.model.js';

class SectionController {
    
    async getSections(req, res) {
        try {
            const { projectId } = req.query;
            const userId = req.user._id;
            
            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }
            
           
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const isMember = project.members.some(member => member.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            const sections = await Section.find({ project: projectId })
                .populate('tasks')
                .sort({ createdAt: 1 });
            res.status(200).json(sections);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching sections', error: error.message });
        }
    }

    
    async addSection(req, res) {
        try {
            const { name, projectId, selectedSectionId } = req.body;
            const userId = req.user._id;

            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

           
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const isMember = project.members.some(member => member.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            let creationDate = new Date();
            if(selectedSectionId){
                const selectedSection = await Section.findById(selectedSectionId);
                if(selectedSection){
                    creationDate = new Date(new Date(selectedSection.createdAt).getTime() + 1000);
                }
            }

            const newSection = new Section({ 
                name, 
                project: project._id,
                tasks: [], 
                createdAt: creationDate 
            });
            await newSection.save();

           
            project.sections.push(newSection._id);
            await project.save();

            res.status(201).json(newSection);
        } catch (error) {
            res.status(400).json({ message: 'Error adding section', error: error.message });
        }
    }

   
    async deleteSection(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            const section = await Section.findById(id);
            if (!section) {
                return res.status(404).json({ message: 'Section not found' });
            }

           
            const project = await Project.findById(section.project);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const isMember = project.members.some(member => member.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            // Delete all tasks in this section
            const { Task } = await import('../tasks/task.model.js');
            await Task.deleteMany({ section: id });

           
            project.sections = project.sections.filter(sId => sId.toString() !== id);
            await project.save();

            await Section.findByIdAndDelete(id);
            res.status(200).json({ message: 'Section deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting section', error: error.message });
        }
    }

  
    async updateSection(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const userId = req.user._id;

            const section = await Section.findById(id);
            if (!section) {
                return res.status(404).json({ message: 'Section not found' });
            }

            
            const project = await Project.findById(section.project);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const isMember = project.members.some(member => member.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            const updatedSection = await Section.findByIdAndUpdate(id, { name }, { new: true });
            res.status(200).json(updatedSection);
        } catch (error) {
            res.status(500).json({ message: 'Error updating section', error: error.message });
        }
    }
}

export default new SectionController();
