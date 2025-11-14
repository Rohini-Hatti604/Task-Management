import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addSection, fetchSections } from "../store/kanbanSlice";
import { logoutUser, fetchCurrentUser } from "../store/authSlice";
import { fetchProjects } from "../store/projectSlice";
//import { fetchUserCount } from "../store/userSlice";

import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar,
  InputAdornment,
  Avatar,
  IconButton,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Drawer,
  Snackbar,
  Alert,
} from "@mui/material";
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import Section from "./Section";
import ProjectSelector from "./ProjectSelector";
import MemberManagement from "./MemberManagement";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import AppleIcon from '@mui/icons-material/Apple';
import MenuIcon from '@mui/icons-material/Menu';
import AuthForm from "./AuthForm";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import dayjs from 'dayjs';

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

const Board = ({ themeMode = 'light', onToggleTheme = () => {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { sections, error: kanbanError } = useSelector((state) => state.kanban);
  const auth = useSelector((state) => state.auth) || {};
  const user = auth?.user;
  const token = auth?.token;
  const userPhoto = auth?.user?.userPhoto;
  const { currentProject, projects } = useSelector((state) => state.project);

  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState("Any"); // Any | Overdue | Today | Week | Month
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [isAuthFormOpen, setIsAuthFormOpen] = useState(false);
  const [isMemberManagementOpen, setIsMemberManagementOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Fetch projects when user logs in
  useEffect(() => {
    if (token) {
      dispatch(fetchProjects());
    }
  }, [dispatch, token]);

  // Fetch sections when project changes
  useEffect(() => {
    if (token && currentProject) {
      dispatch(fetchSections(currentProject._id));
    }
  }, [dispatch, token, currentProject]);

  // Ensure re-render when token changes
  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [token, dispatch]);


  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const allAssignees = Array.from(new Set(
    (sections || []).flatMap(s => (s.tasks || []).map(t => (t.assignee || '').trim())).filter(Boolean)
  ));

  const matchesSearch = (task) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (task.name || '').toLowerCase().includes(q) ||
      (task.description || '').toLowerCase().includes(q) ||
      (task.assignee || '').toLowerCase().includes(q)
    );
  };

  const matchesAssignee = (task) => assigneeFilter === 'All' || (task.assignee || '').trim() === assigneeFilter;
  const matchesStatus = (task) => statusFilter === 'All' || task.status === statusFilter;
  const matchesDue = (task) => {
    if (dueFilter === 'Any') return true;
    const d = task.dueDate ? dayjs(task.dueDate) : null;
    if (!d || !d.isValid()) return false;
    const today = dayjs().startOf('day');
    switch (dueFilter) {
      case 'Overdue':
        return d.isBefore(today, 'day');
      case 'Today':
        return d.isSame(today, 'day');
      case 'Week': {
        const end = today.endOf('week');
        return d.isSame(today, 'day') || (d.isAfter(today, 'day') && d.isBefore(end.add(1, 'day')));
      }
      case 'Month': {
        const end = today.endOf('month');
        return d.isSame(today, 'day') || (d.isAfter(today, 'day') && d.isBefore(end.add(1, 'day')));
      }
      default:
        return true;
    }
  };

  const filteredSections = sections.map(sec => ({
    ...sec,
    tasks: (sec.tasks || []).filter(t => matchesSearch(t) && matchesAssignee(t) && matchesStatus(t) && matchesDue(t))
  }));

  const handleAddSection = async () => {
    if (!token) {
      setSnackbar({ open: true, message: "Please login first to add sections", severity: "warning" });
      setIsAuthFormOpen(true);
      setIsSectionFormOpen(false);
      return;
    }
    
    if (!currentProject) {
      setSnackbar({ open: true, message: "Please select a project first", severity: "warning" });
      setIsSectionFormOpen(false);
      return;
    }

    if (newSectionTitle.trim() !== "") {
      try {
        await dispatch(addSection({ 
          name: newSectionTitle,
          projectId: currentProject._id 
        })).unwrap();
        setNewSectionTitle("");
        setIsSectionFormOpen(false);
        setSnackbar({ open: true, message: "Section added successfully", severity: "success" });
      } catch (error) {
        setSnackbar({ open: true, message: error.message || "Failed to add section", severity: "error" });
      }
    }
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    handleUserMenuClose();
  };

  const renderAuthButton = () => {
    if (!token || !user || !user._id) {
      return (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsAuthFormOpen(true)}
          size={isMobile ? "small" : "medium"}
        >
          Sign Up / Login
        </Button>
      );
    }

    return (
      <Box display="flex" alignItems="center" gap={1}>
        {currentProject && (
          <IconButton 
            onClick={() => setIsMemberManagementOpen(true)}
            title="View Members"
            sx={{ mr: 1 }}
          >
            <PeopleIcon />
          </IconButton>
        )}
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handleUserMenuOpen}>
            <Avatar
              src={userPhoto || undefined}
              alt={user?.name}
              sx={{
                width: isMobile ? 32 : 40,
                height: isMobile ? 32 : 40,
                cursor: 'pointer',
                bgcolor: userPhoto ? undefined : stringToColor(user?.name || ""),
                color: '#fff'
              }}
            >
              {(!userPhoto) ? getInitials(user?.name || "") : null}
            </Avatar>
          </IconButton>
        </Box>
        <Menu
          anchorEl={userMenuAnchorEl}
          open={Boolean(userMenuAnchorEl)}
          onClose={handleUserMenuClose}
        >
          <MenuItem>
            <Typography variant="body2">{user?.name}</Typography>
          </MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Box>
    );
  };



  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh' }}>
      {/* Top Navbar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: 'none', borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: 'nowrap', gap: 1, py: 1 }}>

          {/* Left: Logo & Title */}
          <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
            {isMobile && (
              <IconButton
                color="inherit"
                onClick={() => setMobileMenuOpen(true)}
                edge="start"
              >
                <MenuIcon />
              </IconButton>
            )}
            <AppleIcon fontSize={isMobile ? "medium" : "large"} />
            {!isMobile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
                {/* Top row: Title + Projects */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'nowrap', minWidth: 0 }}>
                  <Typography 
                    noWrap 
                    variant={isMobile ? "body2" : "body1"} 
                    sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: { xs: 120, sm: 200, md: 'unset' } }}
                  >
                    Kanban Board
                  </Typography>
                  {token && null}
                </Box>
                {/* Bottom row: boards • members caption + Project selector */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'nowrap' }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap', display: { xs: 'none', lg: 'inline' } }}
                  >
                    {projects?.length || 0} boards • {currentProject?.members?.length || 0} members
                  </Typography>
                  {token && (
                    <Box sx={{ ml: 0.5, minWidth: 140, flexShrink: 0 }}>
                      <ProjectSelector />
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
          
          {/* Center: Search + Filters */}
          <Box
            display="flex"
            alignItems="center"
            gap={0.5}
            sx={{
              order: isMobile ? 2 : 0,
              width: isMobile ? '100%' : 'auto',
              mt: isMobile ? 1 : 0,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            {!isMobile && (
              <TextField
                variant="outlined"
                placeholder="Search"
                size="small"
                value={searchQuery}
                onChange={handleSearch}
                sx={{
                  flex: 1,
                  minWidth: 150,
                  maxWidth: 180,
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme.palette.background.paper,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="disabled" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            {!isMobile && (
              <FormControl size="small" margin="dense" sx={{ width: 190, flexShrink: 0, pt: 0.5, overflow: 'visible' }}>
                <InputLabel id="assignee-filter-label" shrink>Assignee</InputLabel>
                <Select
                  labelId="assignee-filter-label"
                  value={assigneeFilter}
                  label="Assignee"
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center', pr: 3 } }}
                >
                  <MenuItem value="All">All</MenuItem>
                  {allAssignees.map(a => (
                    <MenuItem key={a} value={a}>{a}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {!isMobile && (
              <FormControl size="small" margin="dense" sx={{ width: 160, flexShrink: 0, pt: 0.5, overflow: 'visible' }}>
                <InputLabel id="status-filter-label" shrink>Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center', pr: 3 } }}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="To Do">To Do</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Done">Done</MenuItem>
                </Select>
              </FormControl>
            )}
            {!isMobile && (
              <FormControl size="small" margin="dense" sx={{ width: 160, flexShrink: 0, pt: 0.5, overflow: 'visible', mr: 1.5 }}>
                <InputLabel id="due-filter-label" shrink>Due</InputLabel>
                <Select
                  labelId="due-filter-label"
                  value={dueFilter}
                  label="Due"
                  onChange={(e) => setDueFilter(e.target.value)}
                  sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center', pr: 3 } }}
                >
                  <MenuItem value="Any">Any</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                  <MenuItem value="Today">Today</MenuItem>
                  <MenuItem value="Week">This Week</MenuItem>
                  <MenuItem value="Month">This Month</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
          {/* Right: Theme + Project + Avatar block */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 3 }}>
            <IconButton
              onClick={onToggleTheme}
              size={isMobile ? 'small' : 'medium'}
              title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="toggle dark mode"
              sx={{
                bgcolor: theme.palette.action.hover,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                width: isMobile ? 34 : 36,
                height: isMobile ? 34 : 36,
                '&:hover': { bgcolor: theme.palette.action.selected }
              }}
            >
              {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            {renderAuthButton()}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 250, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Task DashBoard</Typography>
          <TextField
            variant="outlined"
            placeholder="Search"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={handleSearch}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="disabled" />
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {projects?.length || 0} boards • {currentProject?.members?.length || 0} members
          </Typography>
          {token && (
            <Box sx={{ mt: 2 }}>
              <ProjectSelector />
            </Box>
          )}

          {/* Add Section Button (At End, Aligned with Section Title) */}
          <Box sx={{ display: "flex", alignItems: "center", height: "40px", mt: "10px", ml: "10px" }}>
            <Button variant="text" onClick={() => setIsSectionFormOpen(true)} sx={{ height: "40px", width: "200px", color: theme.palette.text.secondary }}>
              <AddIcon /> Add Section
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Board Content */}
      <Box sx={{ px: 2, pb: 2, mt: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            height: "calc(100vh - 64px - 36px)",
            overflowX: "auto",
            overflowY: "auto",
            p: 2,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            scrollbarWidth: "thin",
            scrollbarColor: `${theme.palette.divider} transparent`,
            "&::-webkit-scrollbar": { height: "5px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.divider,
              borderRadius: "10px",
            },
          }}
        >
          {filteredSections.map((section) => (
            <Box key={section._id}
              sx={{
                minWidth: isMobile ? "85vw" : 300,
                maxWidth: isMobile ? "85vw" : 300,
                mr: 2
              }}
            >
              <Section key={`${section._id}-${section.tasks.length}`} section={section} />
            </Box>
          ))}

          {/* Add Section Button (At End, Aligned with Section Title) */}
          <Box sx={{ display: "flex", alignItems: "center", height: "40px", mt: "10px", ml: "10px" }}>
            <Button variant="text" onClick={() => setIsSectionFormOpen(true)} sx={{ height: "40px", width: "200px", color: theme.palette.text.secondary }}>
              <AddIcon /> Add Section
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Add Section Popup */}
      <Dialog open={isSectionFormOpen} onClose={() => setIsSectionFormOpen(false)}>
        <DialogTitle>Add New Section</DialogTitle>
        <DialogContent>
          <TextField label="Section Title" fullWidth value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSectionFormOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleAddSection}>
            Add Section
          </Button>
        </DialogActions>
      </Dialog>

      {/* Auth Form Popup */}
      <AuthForm open={isAuthFormOpen} handleClose={() => setIsAuthFormOpen(false)} />

      {/* Member Management Popup */}
      {currentProject && (
        <MemberManagement
          open={isMemberManagementOpen}
          onClose={() => setIsMemberManagementOpen(false)}
          project={currentProject}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Error Snackbar */}
      {kanbanError && (
        <Snackbar
          open={!!kanbanError}
          autoHideDuration={6000}
          onClose={() => {}}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity="error" sx={{ width: "100%" }}>
            {kanbanError}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}

export default Board;