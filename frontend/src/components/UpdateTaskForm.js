import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateTask } from "../store/kanbanSlice";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Divider,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Typography,
} from "@mui/material";
import Link from '@mui/material/Link';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import DeleteIcon from '@mui/icons-material/Delete';
import API from "../Axios/api";

const UpdateTaskForm = ({ open, onClose, task, sectionId }) => {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const [taskData, setTaskData] = useState({
    name: "",
    description: "",
    dueDate: dayjs(),
    assignee: ""
  });
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (task) {
      setTaskData({
        name: task.name || "",
        description: task.description || "",
        dueDate: dayjs(task.dueDate),
        assignee: task.assignee || "",
      });
      // Load comments for this task
      fetchComments(task._id);
      // Load attachments for this task
      fetchAttachments(task._id);
    }
  }, [task]);

  const fetchComments = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get(`/task/${taskId}/comments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setComments(res.data || []);
    } catch (e) {
      // silently ignore for now
    }
  };

  const fetchAttachments = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get(`/task/${taskId}/attachments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setAttachments(res.data || []);
    } catch (e) {}
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (newDate) => {
    setTaskData((prev) => ({
      ...prev,
      dueDate: newDate,
    }));
  };

  const handleSubmit = () => {
    dispatch(
      updateTask({
        taskId: task._id,
        sectionId,
        taskData: {
          ...taskData,
          dueDate: taskData.dueDate.toISOString(),
          section: sectionId,
        },
      })
    );
    onClose();
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await API.post(`/task/${task._id}/comments`, { text: commentText.trim() }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
    } catch (e) {}
  };

  const handleDeleteComment = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await API.delete(`/comments/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setComments((prev) => prev.filter(c => c._id !== id));
    } catch (e) {}
  };

  // Helpers for attachments
  const backendOrigin = (() => {
    try {
      const base = API.defaults.baseURL || '';
      // Remove trailing /api if present
      const url = new URL(base, window.location.origin);
      return url.origin;
    } catch (_) {
      return process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:4000';
    }
  })();

  const handleUpload = async () => {
    if (!file || !task?._id) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const res = await API.post(`/task/${task._id}/attachments`, form, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data'
        }
      });
      setAttachments((prev) => [...prev, res.data]);
      setFile(null);
    } catch (e) {}
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const token = localStorage.getItem('token');
      await API.delete(`/task/${task._id}/attachments/${attachmentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setAttachments((prev) => prev.filter(a => a._id !== attachmentId));
    } catch (e) {}
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Task</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label="Task Name"
          type="text"
          fullWidth
          value={taskData.name}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="description"
          label="Description"
          type="text"
          fullWidth
          rows={3}
          value={taskData.description}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="assignee"
          label="Assignee"
          type="text"
          fullWidth
          value={taskData.assignee}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Due Date"
            value={taskData.dueDate}
            onChange={handleDateChange}
            slotProps={{ textField: { fullWidth: true, margin: "dense" } }}
            sx={{ mb: 2 }}
          />
        </LocalizationProvider>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments</Typography>
        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
          <Button component="label" variant="outlined" startIcon={<AttachFileIcon />}> 
            Choose File
            <input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {file ? file.name : 'No file selected'}
          </Typography>
          <Button variant="contained" onClick={handleUpload} disabled={!file}>Upload</Button>
        </Box>
        <List dense>
          {attachments.map((a) => (
            <ListItem key={a._id} secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteAttachment(a._id)}>
                <DeleteIcon />
              </IconButton>
            }>
              <ListItemAvatar>
                <Avatar>
                  <AttachFileIcon fontSize="small" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Link href={`${backendOrigin}${a.url}`} target="_blank" rel="noopener" underline="hover">
                    {a.originalName}
                  </Link>
                }
                secondary={`${Math.round((a.size || 0)/1024)} KB • ${dayjs(a.createdAt).format('DD MMM, HH:mm')}`}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Comments</Typography>
        <Box display="flex" gap={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            size="small"
          />
          <Button variant="contained" onClick={handleAddComment}>Post</Button>
        </Box>
        <List dense sx={{ maxHeight: 240, overflowY: 'auto' }}>
          {comments.map((c) => {
            const canDelete = (authUser?._id && c.author?._id === authUser._id) || (authUser?.id && c.author?._id === authUser.id);
            const name = c.author?.name || 'User';
            const initials = name.split(/\s+/).map(p => p[0]).slice(0,2).join('').toUpperCase();
            return (
              <ListItem key={c._id} secondaryAction={canDelete ? (
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteComment(c._id)}>
                  <DeleteIcon />
                </IconButton>
              ) : null}>
                <ListItemAvatar>
                  <Avatar>{initials}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{name}</Typography>
                      <Typography variant="caption" color="text.secondary">{dayjs(c.createdAt).format('DD MMM, HH:mm')}</Typography>
                    </Box>
                  }
                  secondary={c.text}
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Update Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateTaskForm;