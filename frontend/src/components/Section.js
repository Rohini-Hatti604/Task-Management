import React, { useState, memo } from "react";
import { useDrop } from "react-dnd";
import { useDispatch, useSelector } from "react-redux";
import { addTask, deleteSection, updateSection, moveTask, addSection } from "../store/kanbanSlice";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
} from "@mui/material";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from "@mui/icons-material/Add";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";

const Section = memo(({ section }) => {
  const dispatch = useDispatch();
  const currentProject = useSelector((state) => state.project.currentProject);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");

  const [{ isOver }, drop] = useDrop({
    accept: "TASK",
    drop: (item) => {
      if (item.sourceSectionId !== section._id) {
        dispatch(moveTask({
          taskId: item.taskId,
          sourceSectionId: item.sourceSectionId,
          destinationSectionId: section._id,
          task: item.task
        }));
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
    hover: (item, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      if (item.sourceSectionId === section._id) return;
    }
  });

  const handleAddTask = (taskData) => {
    const newTask = { ...taskData, section: section._id };
    dispatch(addTask(newTask));
  };

  

  const handleAddSection = () => {
    if (newSectionTitle.trim() !== "") {
      if (!currentProject) {
        alert("Please select a project first");
        return;
      }
      const sectionData = {
        name: newSectionTitle,
        projectId: currentProject._id,
        selectedSectionId: section._id
      };
      dispatch(addSection(sectionData));
      setNewSectionTitle("");
      setIsSectionFormOpen(false);
    }
  };

  const handleDeleteSection = () => {
    if (window.confirm(`Are you sure you want to delete the section "${section.name}"?`)) {
      dispatch(deleteSection(section._id));
    }
    setMenuAnchorEl(null);
  };

  const handleUpdateSection = () => {
    const newTitle = prompt("Enter new title for the section:", section.name);
    if (newTitle && newTitle.trim() !== "") {
      dispatch(updateSection({ sectionId: section._id, name: newTitle }));
    }
    setMenuAnchorEl(null);
  };

  const theme = useTheme();

  return (
    <Box 
      ref={drop} 
      height="100%" 
      p={2}
      sx={{
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        opacity: isOver ? 0.7 : 1,
        transition: 'opacity 0.15s ease',
        willChange: 'opacity',
        transform: 'translate3d(0,0,0)',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <h6 className="section-title" style={{ color: theme.palette.text.primary }}>{section.name}</h6>
        <Box>
          <IconButton onClick={() => setIsSectionFormOpen(true)}>
            <AddIcon />
          </IconButton>
          <IconButton
            onClick={(e) => setMenuAnchorEl(e.currentTarget)}
            aria-controls="section-menu"
            aria-haspopup="true"
          >
            <MoreHorizIcon />
          </IconButton>
          <Menu
            id="section-menu"
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={() => setMenuAnchorEl(null)}
          >
            <MenuItem onClick={handleUpdateSection}>Update Title</MenuItem>
            <MenuItem onClick={handleDeleteSection} style={{ color: "red" }}>
              Delete Section
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Box
        mt={1}
        sx={{
          height: "95%",
          overflowY: "auto",
          scrollbarWidth: "thin",
          bgcolor: theme.palette.action.hover,
          padding: 1,
          borderRadius: 2,
          minHeight: "200px",
          transform: 'translate3d(0,0,0)',
        }}
      >
        {(!section.tasks || section.tasks.length === 0) && (
          <Button
            fullWidth
            onClick={() => setIsTaskFormOpen(true)}
            sx={{
              color: theme.palette.text.secondary,
              mt: 1,
              bgcolor: theme.palette.action.hover,
              textTransform: "uppercase",
              fontWeight: 600,
              borderRadius: 2,
              py: 0.75,
              '&:hover': { bgcolor: theme.palette.action.selected }
            }}
          >
            + Add Task
          </Button>
        )}

        {section.tasks?.map((task) => (
          <TaskCard 
            key={`${task._id}-${section._id}`} 
            task={task} 
            sectionId={section._id} 
          />
        ))}

        {section.tasks?.length > 0 && (
          <Button
            fullWidth
            onClick={() => setIsTaskFormOpen(true)}
            sx={{
              color: theme.palette.text.secondary,
              mt: 1,
              bgcolor: theme.palette.action.hover,
              textTransform: "uppercase",
              fontWeight: 600,
              borderRadius: 2,
              py: 0.75,
              '&:hover': { bgcolor: theme.palette.action.selected }
            }}
          >
            + Add Task
          </Button>
        )}
      </Box>

      {/* Add Section Dialog */}
      <Dialog open={isSectionFormOpen} onClose={() => {
        setIsSectionFormOpen(false);
        setNewSectionTitle("");
      }}>
        <DialogTitle>Add New Section</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Section Title"
            fullWidth
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsSectionFormOpen(false);
            setNewSectionTitle("");
          }}>
            Cancel
          </Button>
          <Button onClick={handleAddSection} variant="contained" color="primary">
            Add Section
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Task Dialog */}
      <TaskForm
        open={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={handleAddTask}
        defaultAssignee="Current User"
      />
    </Box>
  );
});

export default Section;
