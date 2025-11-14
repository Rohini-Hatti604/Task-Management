import TaskModel, { Task } from './task.model.js';
import Section from '../sections/section.model.js';
import Project from '../projects/project.model.js';
import path from 'path';
import fs from 'fs';
import User from '../user/user.model.js';
import { sendMail } from '../../utils/mailer.js';

const emailRegex = /.+@.+\..+/;
async function resolveAssigneeEmail(assignee) {
    if (!assignee) return null;
    if (emailRegex.test(assignee)) return assignee;
  
    try {
        const u = await User.findOne({ name: assignee }).lean();
        return u?.email || null;
    } catch (_) {
        return null;
    }
}

export default class TaskController {
    // Get tasks by section
    async getTasks(req, res) {
        const { section } = req.params;
        const userId = req.user._id;
        try {
            
            const sectionDoc = await Section.findById(section);
            if (!sectionDoc) {
                return res.status(404).json({ message: 'Section not found' });
            }

            
            const project = await Project.findById(sectionDoc.project);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const isMember = project.members.some(member => member.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            const tasks = await TaskModel.getTasksBySection(section);
            res.status(200).json(tasks);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Add a new task
    async addTask(req, res) {
        const { name, description, dueDate, assignee, section, status } = req.body;
        const userId = req.user._id;

        try {
            
            const sectionDoc = await Section.findById(section);
            if (!sectionDoc) {
                return res.status(404).json({ message: 'Section not found' });
            }

            
            const project = await Project.findById(sectionDoc.project);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const isMember = project.members.some(member => member.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            const task = await TaskModel.addTask({ name, description, dueDate, assignee, section, status });

            if (!task) {
                return res.status(400).json({ message: "Failed to add task" });
            }
           
            try {
                const to = await resolveAssigneeEmail(assignee);
                if (to) {
                    await sendMail({
                        to,
                        subject: `You have been assigned a task: ${name}`,
                        text: `You have been assigned to the task "${name}".\nDescription: ${description || '-'}\nDue: ${dueDate || '-'}\n`,
                        html: `<p>You have been assigned to the task <strong>${name}</strong>.</p><p>Description: ${description || '-'}<br/>Due: ${dueDate || '-'}</p>`
                    });
                }
            } catch (_) {}

            res.status(201).json({ message: "Task added successfully", task });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }


   
    async updateTask(req, res) {
        const { taskId } = req.params;
        const updatedTask = req.body;
        const userId = req.user._id;

        try {
          
            const task = await Task.findById(taskId);
            if (!task) {
                return res.status(404).json({ message: 'Task not found' });
            }

           
            const project = await Project.findById(task.project);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const isMember = project.members.some(member => member.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            const prevAssignee = task.assignee;
            const updated = await TaskModel.updateTask(taskId, updatedTask);
            
            try {
                const newAssignee = updated?.assignee;
                if (newAssignee && newAssignee !== prevAssignee) {
                    const to = await resolveAssigneeEmail(newAssignee);
                    if (to) {
                        await sendMail({
                            to,
                            subject: `You have been assigned a task: ${updated.name}`,
                            text: `You have been assigned to the task "${updated.name}".\nDescription: ${updated.description || '-'}\nDue: ${updated.dueDate || '-'}\n`,
                            html: `<p>You have been assigned to the task <strong>${updated.name}</strong>.</p><p>Description: ${updated.description || '-'}<br/>Due: ${updated.dueDate || '-'}</p>`
                        });
                    }
                }
            } catch (_) {}
            res.status(200).json({ message: "Task updated successfully", task: updated });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

   
    async moveTask(req, res) {
        const { taskId, sourceSectionId, destinationSectionId } = req.body;
        const userId = req.user._id;
        try {
            
            const sourceSection = await Section.findById(sourceSectionId);
            const destinationSection = await Section.findById(destinationSectionId);
            
            if (!sourceSection || !destinationSection) {
                return res.status(404).json({ message: 'Source or destination section not found' });
            }

            
            if (sourceSection.project.toString() !== destinationSection.project.toString()) {
                return res.status(400).json({ message: 'Cannot move task between different projects' });
            }

           
            const project = await Project.findById(sourceSection.project);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const isMember = project.members.some(member => member.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            const task = await TaskModel.moveTask(taskId, sourceSectionId, destinationSectionId);
            res.status(200).json({ message: "Task moved successfully", task });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

   
    async deleteTask(req, res) {
        const { taskId } = req.params;
        const userId = req.user._id;

        try {
            
            const task = await Task.findById(taskId);
            if (!task) {
                return res.status(404).json({ message: 'Task not found' });
            }

            // Check if user is a project member
            const project = await Project.findById(task.project);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const isMember = project.members.some(member => member.toString() === userId.toString());
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            }

            
            const section = await Section.findById(task.section);
            if (section) {
                section.tasks = section.tasks.filter(tId => tId.toString() !== taskId);
                await section.save();
            }

            await TaskModel.deleteTask(taskId);
            res.status(200).json({ message: "Task deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

  
    async listAttachments(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user._id;
            const task = await Task.findById(taskId);
            if (!task) return res.status(404).json({ message: 'Task not found' });
            const project = await Project.findById(task.project);
            if (!project) return res.status(404).json({ message: 'Project not found' });
            const isMember = project.members.some(m => m.toString() === userId.toString());
            if (!isMember) return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
            res.json(task.attachments || []);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }

  
    async addAttachment(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user._id;
            const task = await Task.findById(taskId);
            if (!task) return res.status(404).json({ message: 'Task not found' });
            const project = await Project.findById(task.project);
            if (!project) return res.status(404).json({ message: 'Project not found' });
            const isMember = project.members.some(m => m.toString() === userId.toString());
            if (!isMember) return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });

            if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
            const file = req.file;
            const url = `/uploads/${file.filename}`;
            const attachment = {
                originalName: file.originalname,
                filename: file.filename,
                url,
                size: file.size,
                mimeType: file.mimetype,
                uploadedBy: userId,
                createdAt: new Date()
            };
            if (!task.attachments) task.attachments = [];
            task.attachments.push(attachment);
            await task.save();
            res.status(201).json(attachment);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }

   
    async deleteAttachment(req, res) {
        try {
            const { taskId, attachmentId } = req.params;
            const userId = req.user._id;
            const task = await Task.findById(taskId);
            if (!task) return res.status(404).json({ message: 'Task not found' });
            const project = await Project.findById(task.project);
            if (!project) return res.status(404).json({ message: 'Project not found' });
            const isMember = project.members.some(m => m.toString() === userId.toString());
            if (!isMember) return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });

            const att = task.attachments.id(attachmentId) || task.attachments.find(a => a._id?.toString() === attachmentId);
            if (!att) return res.status(404).json({ message: 'Attachment not found' });

           
            try {
                const filePath = path.join(process.cwd(), 'uploads', att.filename);
                fs.existsSync(filePath) && fs.unlinkSync(filePath);
            } catch (_) {}

            task.attachments = task.attachments.filter(a => a._id?.toString() !== attachmentId);
            await task.save();
            res.json({ message: 'Attachment deleted' });
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
}
