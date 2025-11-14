import Project from './project.model.js';
import Section from '../sections/section.model.js';
import { Task } from '../tasks/task.model.js';
import User from '../user/user.model.js';
import { sendMail } from '../../utils/mailer.js';

class ProjectController {
    
    async getProjects(req, res) {
        try {
            const userId = req.user._id;
            const projects = await Project.find({ members: userId })
                .populate('members', 'name email userPhoto')
                .populate('createdBy', 'name email userPhoto')
                .populate({
                    path: 'sections',
                    populate: {
                        path: 'tasks',
                        model: 'Task'
                    }
                })
                .sort({ createdAt: -1 });
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching projects', error: error.message });
        }
    }

    // Get a single project by ID
    async getProject(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;
            
            const project = await Project.findById(id)
                .populate('members', 'name email userPhoto')
                .populate('createdBy', 'name email userPhoto')
                .populate({
                    path: 'sections',
                    populate: {
                        path: 'tasks',
                        model: 'Task'
                    }
                });

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            
            const isMember = project.members.some(member => member._id.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            res.status(200).json(project);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching project', error: error.message });
        }
    }

    // Create a new project
    async createProject(req, res) {
        try {
            const { name, description, members } = req.body;
            const userId = req.user._id;

            // Ensure creator is included in members
            const projectMembers = members && Array.isArray(members) 
                ? [...new Set([userId.toString(), ...members.map(m => m.toString())])]
                : [userId];

            const project = new Project({
                name,
                description: description || '',
                members: projectMembers,
                createdBy: userId
            });

            
            const defaultSections = [
                { name: 'To Do', project: project._id },
                { name: 'In Progress', project: project._id },
                { name: 'Done', project: project._id }
            ];

            const sections = await Section.insertMany(defaultSections);
            project.sections = sections.map(s => s._id);
            
            await project.save();

            const populatedProject = await Project.findById(project._id)
                .populate('members', 'name email userPhoto')
                .populate('createdBy', 'name email userPhoto')
                .populate('sections');

            res.status(201).json(populatedProject);
        } catch (error) {
            res.status(400).json({ message: 'Error creating project', error: error.message });
        }
    }

    // Update a project
    async updateProject(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            const userId = req.user._id;

            const project = await Project.findById(id);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            
            const isMember = project.members.some(member => member.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            if (name) project.name = name;
            if (description !== undefined) project.description = description;

            await project.save();

            const updatedProject = await Project.findById(project._id)
                .populate('members', 'name email userPhoto')
                .populate('createdBy', 'name email userPhoto')
                .populate('sections');

            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(500).json({ message: 'Error updating project', error: error.message });
        }
    }

    // Delete a project
    async deleteProject(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            const project = await Project.findById(id);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            
            if (project.createdBy.toString() !== userId.toString()) {
                return res.status(403).json({ message: 'Access denied. Only the project creator can delete the project.' });
            }

           
            const taskIds = [];
            for (const sectionId of project.sections) {
                const section = await Section.findById(sectionId);
                if (section && section.tasks) {
                    taskIds.push(...section.tasks);
                }
            }
            if (taskIds.length > 0) {
                await Task.deleteMany({ _id: { $in: taskIds } });
            }

            
            await Section.deleteMany({ _id: { $in: project.sections } });

          
            await Project.findByIdAndDelete(id);

            res.status(200).json({ message: 'Project deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting project', error: error.message });
        }
    }

    // Add member to project
    async addMember(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            const currentUserId = req.user._id;

            const project = await Project.findById(id);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            
            const isMember = project.members.some(member => member.toString() === currentUserId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            
            if (project.members.includes(userId)) {
                return res.status(400).json({ message: 'User is already a member of this project.' });
            }

            project.members.push(userId);
            await project.save();

            const updatedProject = await Project.findById(project._id)
                .populate('members', 'name email userPhoto')
                .populate('createdBy', 'name email userPhoto');

            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(500).json({ message: 'Error adding member', error: error.message });
        }
    }

  
    async removeMember(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            const currentUserId = req.user._id;

            const project = await Project.findById(id);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Only creator can remove members (or user can remove themselves)
            if (project.createdBy.toString() !== currentUserId.toString() && userId !== currentUserId.toString()) {
                return res.status(403).json({ message: 'Access denied. Only the project creator can remove members.' });
            }

            // Can't remove the creator
            if (project.createdBy.toString() === userId) {
                return res.status(400).json({ message: 'Cannot remove the project creator.' });
            }

            project.members = project.members.filter(member => member.toString() !== userId);
            await project.save();

            const updatedProject = await Project.findById(project._id)
                .populate('members', 'name email userPhoto')
                .populate('createdBy', 'name email userPhoto');

            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(500).json({ message: 'Error removing member', error: error.message });
        }
    }

  
  async inviteMember(req, res) {
    try {
      const { id } = req.params;
      const { email } = req.body;
      const currentUserId = req.user._id;

      if (!email || !/.+@.+\..+/.test(email)) {
        return res.status(400).json({ message: 'Valid email is required' });
      }

      const project = await Project.findById(id);
      if (!project) return res.status(404).json({ message: 'Project not found' });

      
      const isMember = project.members.some(m => m.toString() === currentUserId.toString());
      if (!isMember) return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });

      const existing = await User.findOne({ email }).lean();
      if (existing) {
        
        if (project.members.some(m => m.toString() === existing._id.toString())) {
          return res.status(200).json({ message: 'User is already a member' });
        }
        project.members.push(existing._id);
        await project.save();
        const updatedProject = await Project.findById(project._id)
          .populate('members', 'name email userPhoto')
          .populate('createdBy', 'name email userPhoto');
        return res.status(200).json(updatedProject);
      }

     
      const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const signupUrl = `${appUrl}/signup?email=${encodeURIComponent(email)}&project=${project._id}`;
      try {
        await sendMail({
          to: email,
          subject: `Invitation to join project: ${project.name}`,
          text: `You have been invited to join the project "${project.name}". Create your account here: ${signupUrl}`,
          html: `<p>You have been invited to join the project <strong>${project.name}</strong>.</p><p><a href="${signupUrl}">Click here to create your account and join</a></p>`
        });
      } catch (_) {}
      return res.status(202).json({ message: 'Invite sent if email is deliverable' });
    } catch (error) {
      return res.status(500).json({ message: 'Error inviting member', error: error.message });
    }
  }
}

export default new ProjectController();

