import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import {
  fetchProjects,
  setCurrentProject,
  createProject,
} from "../store/projectSlice";
import { updateProject, deleteProject } from "../store/projectSlice";
import { fetchSections } from "../store/kanbanSlice";
import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ProjectForm from "./ProjectForm";

const ProjectSelector = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { projects, currentProject, loading } = useSelector((state) => state.project);
  const token = useSelector((state) => state.auth.token);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (token) {
      dispatch(fetchProjects());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (currentProject && token) {
      dispatch(fetchSections(currentProject._id));
    }
  }, [dispatch, currentProject, token]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProjectSelect = (project) => {
    dispatch(setCurrentProject(project));
    dispatch(fetchSections(project._id));
    handleMenuClose();
  };

  const openEdit = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name || "");
    setEditDialogOpen(true);
  };

  const submitEdit = async () => {
    if (!editingProject) return;
    try {
      await dispatch(updateProject({ projectId: editingProject._id, name: editName })).unwrap();
      if (currentProject?._id === editingProject._id) {
        dispatch(setCurrentProject({ ...currentProject, name: editName }));
      }
      setEditDialogOpen(false);
      setEditingProject(null);
      setEditName("");
      dispatch(fetchProjects());
    } catch (e) {
      // swallow; could add snackbar if desired
    }
  };

  const openDelete = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setDeleteDialogOpen(true);
  };

  const submitDelete = async () => {
    if (!editingProject) return;
    try {
      await dispatch(deleteProject(editingProject._id)).unwrap();
      setDeleteDialogOpen(false);
      setEditingProject(null);
      dispatch(fetchProjects());
    } catch (e) {
      // swallow; could add snackbar if desired
    }
  };

  const handleCreateProject = (projectData) => {
    dispatch(createProject(projectData));
    setIsProjectFormOpen(false);
  };

  if (!token) return null;

  return (
    <>
      <Button
        onClick={handleMenuOpen}
        startIcon={<FolderIcon />}
        sx={{
          color: theme.palette.text.primary,
          textTransform: "none",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
          {currentProject?.name || "Select Project"}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 250,
            maxHeight: 400,
            mt: 1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Projects
          </Typography>
        </Box>
        <Divider />
        
        {projects.map((project) => (
          <MenuItem
            key={project._id}
            onClick={() => handleProjectSelect(project)}
            selected={currentProject?._id === project._id}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ListItemIcon>
              <FolderIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={project.name} />
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e)=>e.stopPropagation()}>
              <Tooltip title="Rename">
                <IconButton size="small" onClick={(e)=>openEdit(project, e)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={(e)=>openDelete(project, e)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {currentProject?._id === project._id && (
              <CheckIcon fontSize="small" color="primary" />
            )}
          </MenuItem>
        ))}
        
        <Divider />
        <MenuItem onClick={() => {
          handleMenuClose();
          setIsProjectFormOpen(true);
        }}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Create New Project" />
        </MenuItem>
      </Menu>

      <ProjectForm
        open={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Rename Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Project Name"
            value={editName}
            onChange={(e)=>setEditName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitEdit} disabled={!editName.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Project Confirm */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete "{editingProject?.name}"? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={submitDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProjectSelector;
