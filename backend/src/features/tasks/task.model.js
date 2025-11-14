
import mongoose from 'mongoose';
import Section from '../sections/section.model.js';

const taskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    assignee: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['To Do', 'In Progress', 'Done'],
        default: 'To Do'
    },
    project: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project', 
        required: true 
    },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    attachments: [
        {
            originalName: { type: String, required: true },
            filename: { type: String, required: true },
            url: { type: String, required: true },
            size: { type: Number, required: true },
            mimeType: { type: String, required: true },
            uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

// Export Task model as well
export { Task };

export default class TaskModel {

    static async addTask({ name, description, dueDate, assignee, section, status }) {
        try {
            const sectionDoc = await Section.findById(section).populate('project');

            if (!sectionDoc) {
                throw new Error("Section does not exist");
            }

            if (!sectionDoc.project) {
                throw new Error("Section must belong to a project");
            }

            // Determine status from section name if not provided
            let taskStatus = status;
            if (!taskStatus) {
                const sectionName = sectionDoc.name.toLowerCase();
                if (sectionName.includes('progress')) {
                    taskStatus = 'In Progress';
                } else if (sectionName.includes('done') || sectionName.includes('complete')) {
                    taskStatus = 'Done';
                } else {
                    taskStatus = 'To Do';
                }
            }

            const newTask = new Task({ 
                name, 
                description, 
                dueDate, 
                assignee: assignee.trim(), 
                section: sectionDoc._id,
                project: sectionDoc.project._id,
                status: taskStatus
            });

            // Add the new task to the corresponding section
            sectionDoc.tasks.push(newTask._id);

            await sectionDoc.save(); // Save the updated section

            return await newTask.save();
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async getTasksBySection(section) {
        return await Task.find({ section });
    }

    static async updateTask(id, updatedTask) {
        try {
            const task = await Task.findByIdAndUpdate(id, updatedTask, { new: true });
            if (!task) throw new Error("Task not found");
            return task;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async deleteTask(id) {
        return await Task.findByIdAndDelete(id);
    }

    static async moveTask(taskId, sourceSectionId, destinationSectionId) {
        try {
            // 1. Find source and destination sections
            const sourceSection = await Section.findById(sourceSectionId);
            const destinationSection = await Section.findById(destinationSectionId);
            if (!sourceSection || !destinationSection) {
                throw new Error('Source or Destination section not found');
            }

            // Ensure both sections belong to the same project
            if (sourceSection.project.toString() !== destinationSection.project.toString()) {
                throw new Error('Cannot move task between different projects');
            }
    
            // 2. Find the task
            const task = await Task.findById(taskId);
            if (!task) {
                throw new Error('Task not found');
            }
    
            // 3. Remove task from the source section
            sourceSection.tasks = sourceSection.tasks.filter(id => id.toString() !== taskId.toString());
            await sourceSection.save();
    
            // 4. Move task to new section and update status based on section name
            task.section = destinationSectionId;
            const sectionName = destinationSection.name.toLowerCase();
            if (sectionName.includes('progress')) {
                task.status = 'In Progress';
            } else if (sectionName.includes('done') || sectionName.includes('complete')) {
                task.status = 'Done';
            } else {
                task.status = 'To Do';
            }
            await task.save();
    
            // 5. Add task to the destination section
            destinationSection.tasks.push(task._id);
            await destinationSection.save();
    
            // 6. Return the updated task with populated data
            return await Task.findById(taskId).populate("section").populate("project");
        } catch (err) {
            throw new Error(err.message);
        }
    }
    
}

