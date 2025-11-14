import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../Axios/api";

// Fetch all projects for the current user
export const fetchProjects = createAsyncThunk("project/fetchProjects", async () => {
    try {
        const response = await API.get("/project");
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch projects";
        throw new Error(errorMessage);
    }
});

// Fetch a single project
export const fetchProject = createAsyncThunk("project/fetchProject", async (projectId) => {
    try {
        const response = await API.get(`/project/${projectId}`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch project";
        throw new Error(errorMessage);
    }
});

// Create a new project
export const createProject = createAsyncThunk("project/createProject", async (projectData) => {
    try {
        const response = await API.post("/project", projectData);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to create project";
        throw new Error(errorMessage);
    }
});

// Update a project
export const updateProject = createAsyncThunk("project/updateProject", async ({ projectId, ...projectData }) => {
    try {
        const response = await API.put(`/project/${projectId}`, projectData);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update project";
        throw new Error(errorMessage);
    }
});

// Delete a project
export const deleteProject = createAsyncThunk("project/deleteProject", async (projectId) => {
    try {
        await API.delete(`/project/${projectId}`);
        return projectId;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete project";
        throw new Error(errorMessage);
    }
});

// Add member to project
export const addMember = createAsyncThunk("project/addMember", async ({ projectId, userId }) => {
    try {
        const response = await API.post(`/project/${projectId}/members`, { userId });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to add member";
        throw new Error(errorMessage);
    }
});

// Remove member from project
export const removeMember = createAsyncThunk("project/removeMember", async ({ projectId, userId }) => {
    try {
        const response = await API.delete(`/project/${projectId}/members`, { data: { userId } });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to remove member";
        throw new Error(errorMessage);
    }
});

const initialState = {
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
};

const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        setCurrentProject: (state, action) => {
            state.currentProject = action.payload;
        },
        clearProjects: (state) => {
            state.projects = [];
            state.currentProject = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Projects
            .addCase(fetchProjects.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjects.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = action.payload;
                // Set first project as current if none is set
                if (!state.currentProject && action.payload.length > 0) {
                    state.currentProject = action.payload[0];
                }
            })
            .addCase(fetchProjects.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch Single Project
            .addCase(fetchProject.fulfilled, (state, action) => {
                state.currentProject = action.payload;
               
                const index = state.projects.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.projects[index] = action.payload;
                } else {
                    state.projects.push(action.payload);
                }
            })
            // Create Project
            .addCase(createProject.fulfilled, (state, action) => {
                state.projects.push(action.payload);
                state.currentProject = action.payload;
            })
            // Update Project
            .addCase(updateProject.fulfilled, (state, action) => {
                const index = state.projects.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.projects[index] = action.payload;
                }
                if (state.currentProject?._id === action.payload._id) {
                    state.currentProject = action.payload;
                }
            })
            // Delete Project
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.projects = state.projects.filter(p => p._id !== action.payload);
                if (state.currentProject?._id === action.payload) {
                    state.currentProject = state.projects.length > 0 ? state.projects[0] : null;
                }
            })
            // Add Member
            .addCase(addMember.fulfilled, (state, action) => {
                const index = state.projects.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.projects[index] = action.payload;
                }
                if (state.currentProject?._id === action.payload._id) {
                    state.currentProject = action.payload;
                }
            })
            // Remove Member
            .addCase(removeMember.fulfilled, (state, action) => {
                const index = state.projects.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.projects[index] = action.payload;
                }
                if (state.currentProject?._id === action.payload._id) {
                    state.currentProject = action.payload;
                }
            });
    },
});

export const { setCurrentProject, clearProjects } = projectSlice.actions;
export default projectSlice.reducer;

