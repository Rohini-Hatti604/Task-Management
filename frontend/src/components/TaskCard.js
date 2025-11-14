import React, { useState, memo, useCallback } from "react";
import { useDrag } from "react-dnd";
import { useDispatch } from "react-redux";
import { deleteTask } from "../store/kanbanSlice";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Tooltip,
  useTheme,
} from "@mui/material";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import dayjs from "dayjs";
import UpdateTaskForm from "./UpdateTaskForm";

// Import plugins for relative date formatting
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import isTomorrow from "dayjs/plugin/isTomorrow";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(isTomorrow);


const stringToColor = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return `#${"00000".substring(0, 6 - c.length) + c}`;
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0][0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase();
};

const formatDueDate = (dueDate, theme) => {
  const date = dayjs(dueDate);
  if (date.isToday()) return { text: "Today", color: theme.palette.text.secondary };
  if (date.isTomorrow()) return { text: "Tomorrow", color: theme.palette.primary.main };
  if (date.isYesterday()) return { text: "Yesterday", color: theme.palette.error.main };
  return { text: date.format("DD MMM"), color: theme.palette.text.secondary };
};


const TaskCard = memo(({ task, sectionId }) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  const theme = useTheme();
  const { text: dueText, color: dueColor } = formatDueDate(task.dueDate, theme);

  
  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: () => ({
      taskId: task._id,
      sourceSectionId: sectionId,
      task: task
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleMenuOpen = useCallback((event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Are you sure you want to delete the task "${task.name}"?`)) {
      dispatch(deleteTask({ sectionId, taskId: task._id }));
    }
    handleMenuClose();
  }, [dispatch, handleMenuClose, sectionId, task._id, task.name]);

  const handleUpdateTask = useCallback(() => {
    setIsUpdateFormOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  return (
    <Box
      ref={drag}
      sx={{
        m: 1,
        bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.background.paper,
        py: 1,
        px: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.6)' : '0px 1px 4px rgba(0,0,0,0.1)',
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        opacity: isDragging ? 0.5 : 1, // Reduce opacity while dragging
        cursor: "grab",
        transition: 'all 0.15s ease',
        willChange: 'transform, opacity',
        transform: 'translate3d(0,0,0)',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark' ? '0 2px 6px rgba(0,0,0,0.7)' : '0 2px 8px rgba(0,0,0,0.15)',
        }
      }}
    >
     
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {task.name}
        </Typography>
        <IconButton size="small" onClick={handleMenuOpen} sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}>
          <MoreHorizIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} disableAutoFocusItem MenuListProps={{ onClick: handleMenuClose }}>
          <MenuItem onClick={handleDelete}>Delete</MenuItem>
          <MenuItem onClick={handleUpdateTask}>Update</MenuItem>
        </Menu>
      </Box>

      
      <Box display="flex" alignItems="center" justifyContent="space-between">
     
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title={task.assignee || "Unassigned"} arrow>
            <Avatar
              alt={task.assignee}
              sx={{
                width: 24,
                height: 24,
                fontSize: "0.75rem",
                bgcolor: stringToColor(task.assignee || ""),
                color: "#fff"
              }}
            >
              {getInitials(task.assignee || "")}
            </Avatar>
          </Tooltip>
          <Typography variant="caption" sx={{ fontWeight: 600, color: dueColor }}>
            {dueText}
          </Typography>
        </Box>

       
        {task.description && (
          <Button
            variant="contained"
            size="small"
            sx={{
              bgcolor: theme.palette.action.hover,
              color: theme.palette.text.secondary,
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              width: "fit-content",
              '&:hover': {
                bgcolor: theme.palette.action.selected,
              }
            }}
            disableElevation
          >
            {task.description}
          </Button>
        )}
      </Box>

     
      <UpdateTaskForm
        open={isUpdateFormOpen}
        onClose={() => setIsUpdateFormOpen(false)}
        task={task}
        sectionId={sectionId}
      />
    </Box>
  );
});

export default TaskCard;
