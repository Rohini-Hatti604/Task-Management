import Project from '../features/projects/project.model.js';


const ProjectMembership = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const projectId = req.params.projectId || req.params.id || req.body.projectId;

        if (!projectId) {
            
            const sectionId = req.params.section || req.body.section;
            if (sectionId) {
                const Section = (await import('../features/sections/section.model.js')).default;
                const section = await Section.findById(sectionId);
                if (section && section.project) {
                    req.projectId = section.project.toString();
                } else {
                    return res.status(400).json({ message: 'Invalid section or section has no project' });
                }
            } else {
                return res.status(400).json({ message: 'Project ID is required' });
            }
        } else {
            req.projectId = projectId;
        }

        const project = await Project.findById(req.projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

       
        const isMember = project.members.some(member => 
            member.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({ 
                message: 'Access denied. You are not a member of this project.' 
            });
        }

        req.project = project;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking project membership', error: error.message });
    }
};

export default ProjectMembership;

