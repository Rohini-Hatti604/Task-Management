import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
} from "@mui/material";
import { addMember, removeMember, fetchProject } from "../store/projectSlice";
import API from "../Axios/api";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";

const MemberManagement = ({ open, onClose, project }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const projects = useSelector((state) => state.project.projects);
  const [emailToAdd, setEmailToAdd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteEnabled, setInviteEnabled] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Fetch all users to find by email
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    
    if (open && project) {
    
    }
  }, [open, project]);

  const handleAddMember = async () => {
    if (!emailToAdd.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");
    setInviteEnabled(false);

    try {
      // Get user by email
      const userResponse = await API.get(`/auth/by-email?email=${emailToAdd}`);
      const user = userResponse.data;

      if (!user || !user._id) {
        setError("User not found. You can send an invite.");
        setInviteEnabled(true);
        setLoading(false);
        return;
      }

      
      const isAlreadyMember = project.members.some(m => {
        const memberId = typeof m === 'object' ? m._id : m;
        return memberId && memberId.toString() === user._id.toString();
      });

      if (isAlreadyMember) {
        setError("User is already a member of this project");
        setLoading(false);
        return;
      }

      // Add member to project
      await dispatch(addMember({ projectId: project._id, userId: user._id })).unwrap();
     
      await dispatch(fetchProject(project._id));
      setEmailToAdd("");
      setError("");
    } catch (err) {
      if (err.response?.status === 404) {
        setError("User not found. You can send an invite.");
        setInviteEnabled(true);
      } else {
        const errorMessage = err.response?.data?.message || err.message || "Failed to add member";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!emailToAdd.trim()) return;
    setInviteLoading(true);
    setError("");
    try {
      await API.post(`/project/${project._id}/invite`, { email: emailToAdd });
      setError("Invitation sent successfully.");
      setInviteEnabled(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to send invite";
      setError(errorMessage);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    const creatorId = typeof project.createdBy === 'object' ? project.createdBy._id : project.createdBy;
    if (creatorId && creatorId.toString() === userId.toString()) {
      setError("Cannot remove project creator");
      return;
    }

    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        await dispatch(removeMember({ projectId: project._id, userId })).unwrap();
        // Refresh project data
        await dispatch(fetchProject(project._id));
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to remove member";
        setError(errorMessage);
      }
    }
  };

  const creatorId = project?.createdBy ? (typeof project.createdBy === 'object' ? project.createdBy._id : project.createdBy) : null;
  const currentUserId = currentUser?.id || currentUser?._id;
  const isCreator = creatorId && currentUserId && creatorId.toString() === currentUserId.toString();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Project Members</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {project?.members?.length || 0} member(s)
        </Typography>

        <List>
          {project?.members?.map((member) => (
            <React.Fragment key={member._id || member}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar src={member.userPhoto} alt={member.name}>
                    {member.name ? member.name[0].toUpperCase() : <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.name || "Unknown User"}
                  secondary={member.email}
                />
                <ListItemSecondaryAction>
                  {member._id === project.createdBy && (
                    <Chip label="Creator" size="small" color="primary" />
                  )}
                  {isCreator &&
                    member._id !== project.createdBy &&
                    member._id !== currentUser?.id && (
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveMember(member._id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>

        {isCreator && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Add Member
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter user email"
                value={emailToAdd}
                onChange={(e) => {
                  setEmailToAdd(e.target.value);
                  setError("");
                  setInviteEnabled(false);
                }}
                error={!!error}
                helperText={error}
              />
              <Button
                variant="contained"
                onClick={handleAddMember}
                disabled={loading}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
              {inviteEnabled && (
                <Button
                  variant="outlined"
                  onClick={handleInvite}
                  disabled={inviteLoading}
                >
                  Invite
                </Button>
              )}
            </Box>
            {!inviteEnabled && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Note: User must be registered in the system
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemberManagement;

