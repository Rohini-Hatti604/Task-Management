import { configureStore } from "@reduxjs/toolkit";
import kanbanReducer from "./kanbanSlice";
import authReducer from "./authSlice";
import projectReducer from "./projectSlice";

const store = configureStore({
  reducer: {
    kanban: kanbanReducer,
    auth: authReducer,
    project: projectReducer,
  },
});

export default store;
