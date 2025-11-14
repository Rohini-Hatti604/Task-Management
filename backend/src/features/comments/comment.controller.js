import Comment from './comment.model.js';
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

class CommentController {
  async list(req, res) {
    try {
      const { taskId } = req.params;
      const check = await ensureProjectMemberByTask(taskId, req.user._id);
      if (check.error) return res.status(check.error.includes('denied') ? 403 : 404).json({ message: check.error });
      const comments = await Comment.find({ task: taskId })
        .populate('author', 'name email userPhoto')
        .sort({ createdAt: 1 });
      res.json(comments);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  async add(req, res) {
    try {
      const { taskId } = req.params;
      const { text } = req.body;
      if (!text || !text.trim()) return res.status(400).json({ message: 'Text is required' });
      const check = await ensureProjectMemberByTask(taskId, req.user._id);
      if (check.error) return res.status(check.error.includes('denied') ? 403 : 404).json({ message: check.error });
      const comment = await Comment.create({ task: taskId, author: req.user._id, text: text.trim() });
      const populated = await comment.populate('author', 'name email userPhoto');
      res.status(201).json(populated);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  async remove(req, res) {
    try {
      const { commentId } = req.params;
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
      const check = await ensureProjectMemberByTask(comment.task, req.user._id);
      if (check.error) return res.status(check.error.includes('denied') ? 403 : 404).json({ message: check.error });
    
      if (comment.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only the author can delete this comment' });
      }
      await Comment.findByIdAndDelete(commentId);
      res.json({ message: 'Comment deleted' });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
}

export default new CommentController();
