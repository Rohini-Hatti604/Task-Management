import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../Axios/api";

export const fetchSections = createAsyncThunk("kanban/fetchSections", async (projectId) => {
    
    const url = projectId ? `/section?projectId=${projectId}` : '/section';
    const response = await API.get(url);
    return response.data;
});

const initialState = {
    sections: [],
    loading: false,
    error: null,
};

export const addSection = createAsyncThunk("kanban/addSection", async (sectionData) => {
    try {
        const response = await API.post('/section', {
            name: sectionData.name,
            projectId: sectionData.projectId, // Required now
            selectedSectionId: sectionData.selectedSectionId
        });
        return response.data;
    } catch (error) {
       
        const errorMessage = error.response?.data?.message || error.message || "Failed to add section";
        throw new Error(errorMessage);
    }
});

export const updateSection = createAsyncThunk(
    "kanban/updateSection",
    async ({ sectionId, name }) => {
        await API.put(`/section/${sectionId}`, { name });
        return { sectionId, name };
    }
);

export const deleteSection = createAsyncThunk("kanban/deleteSection", async (sectionId) => {
    await API.delete(`/section/${sectionId}`);
    return sectionId;
});

export const addTask = createAsyncThunk("kanban/addTask", async (taskData) => {
    const response = await API.post("/task", taskData);
    return {
        sectionId: taskData.section,
        task: response.data.task,
    };
});

export const updateTask = createAsyncThunk("kanban/updateTask", async ({ taskId, sectionId, taskData }) => {
    const response = await API.put(`/task/${taskId}`, taskData);
    return { sectionId, taskId, updatedTask: response.data.task };
});

export const deleteTask = createAsyncThunk("kanban/deleteTask", async ({ sectionId, taskId }) => {
    await API.delete(`/task/${taskId}`);
    return { sectionId, taskId };
});

export const moveTask = createAsyncThunk(
    'kanban/moveTask',
    async ({ taskId, sourceSectionId, destinationSectionId }, { dispatch }) => {
        try {
            
            const response = await API.patch(`/task/move`, {
                taskId,
                sourceSectionId,
                destinationSectionId
            });

            return {
                taskId,
                sourceSectionId,
                destinationSectionId,
                task: response.data.task
            };
        } catch (error) {
            throw error;
        }
    }
);

const kanbanSlice = createSlice({
    name: "kanban",
    initialState,
    reducers: {
        addSectionLocal: (state, action) => {
            state.sections.push(action.payload);
        },
        updateSectionLocal: (state, action) => {
            const { sectionId, name } = action.payload;
            const section = state.sections.find((s) => s._id === sectionId);
            if (section) section.name = name;
        },
        deleteSectionLocal: (state, action) => {
            state.sections = state.sections.filter((s) => s._id !== action.payload);
        },
        addTaskLocal: (state, action) => {
            const { sectionId, task } = action.payload;
            const section = state.sections.find((s) => s._id === sectionId);
            if (section) section.tasks.push(task);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSections.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSections.fulfilled, (state, action) => {
                state.loading = false;
                state.sections = action.payload;
            })
            .addCase(fetchSections.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(addSection.pending, (state) => {
                state.loading = true;
            })
            .addCase(addSection.fulfilled, (state, action) => {
                state.loading = false;
                
                const newSection = {
                    ...action.payload,
                    tasks: []
                };
                state.sections.push(newSection);
                
                state.sections.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            })
            .addCase(addSection.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(updateSection.fulfilled, (state, action) => {
                const section = state.sections.find((s) => s._id === action.payload.sectionId);
                if (section) section.name = action.payload.name;
            })
            .addCase(deleteSection.fulfilled, (state, action) => {
                state.sections = state.sections.filter((s) => s._id !== action.payload);
            })
            .addCase(addTask.fulfilled, (state, action) => {

                const { sectionId, task } = action.payload;
                const section = state.sections.find((s) => s._id === sectionId);

                if (section) {
                    if (!section.tasks) section.tasks = [];
                    section.tasks.push({...task
                    });
                }
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                const { sectionId, taskId, updatedTask } = action.payload;
                const section = state.sections.find((s) => s._id === sectionId);
                if (section) {
                    const taskIndex = section.tasks.findIndex((t) => t._id === taskId);
                    if (taskIndex !== -1) {
                        section.tasks[taskIndex] = updatedTask;
                    }
                }
            })
            .addCase(deleteTask.fulfilled, (state, action) => {
                const section = state.sections.find((s) => s._id === action.payload.sectionId);
                if (section) section.tasks = section.tasks.filter((t) => t._id !== action.payload.taskId);
            })
            .addCase(moveTask.fulfilled, (state, action) => {
                const { taskId, sourceSectionId, destinationSectionId, task } = action.payload;

                const sourceSection = state.sections.find(s => s._id === sourceSectionId);
                const destSection = state.sections.find(s => s._id === destinationSectionId);

                if (sourceSection && destSection) {
                    
                    sourceSection.tasks = sourceSection.tasks.filter(t => t._id !== taskId);

                    
                    if (!destSection.tasks) destSection.tasks = [];
                    destSection.tasks.push(task);
                }
            });
    },
});

export default kanbanSlice.reducer;

