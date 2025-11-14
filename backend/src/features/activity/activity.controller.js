import Activity from './activity.model.js';
import { Task } from '../tasks/task.model.js';
import Section from '../sections/section.model.js';
import Project from '../projects/project.model.js';

const ensureProjectMemberByTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) return { error: 'Task not found' };
  let projectId = task.project;
  if (!projectId) {
    const section = await Section.findById(task.section);
    projectId = section?.project;
  }
  if (!projectId) return { error: 'Project not found for task' };
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found' };
  const isMember = project.members.some(m => m.toString() === userId.toString());
  if (!isMember) return { error: 'Access denied. You are not a member of this project.' };
  return { projectId, taskId };
};

export const logActivity = async ({ entityType, entityId, action, actor, metadata }) => {
  try {
    await Activity.create({ entityType, entityId, action, actor, metadata });
  } catch (e) {
   
  }
};

class ActivityController {
  async listByTask(req, res) {
    try {
      const { taskId } = req.params;
      const check = await ensureProjectMemberByTask(taskId, req.user._id);
      if (check.error) return res.status(check.error.includes('denied') ? 403 : 404).json({ message: check.error });
      const items = await Activity.find({ entityType: 'task', entityId: taskId })
        .populate('actor', 'name email userPhoto')
        .sort({ createdAt: -1 });
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
}

export default new ActivityController();
