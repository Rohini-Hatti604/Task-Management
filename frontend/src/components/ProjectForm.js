import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from "@mui/material";

const ProjectForm = ({ open, onClose, onSubmit, project = null }) => {
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    onSubmit(formData);
    setFormData({ name: "", description: "" });
    setError("");
  };

  const handleClose = () => {
    setFormData({ name: "", description: "" });
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
      <DialogContent>
        <TextField
          name="name"
          label="Project Name"
          fullWidth
          margin="normal"
          value={formData.name}
          onChange={handleChange}
          required
          error={!!error}
          helperText={error}
        />
        <TextField
          name="description"
          label="Description (Optional)"
          fullWidth
          margin="normal"
          multiline
          rows={3}
          value={formData.description}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {project ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectForm;

