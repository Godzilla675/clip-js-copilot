import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectState } from '../../types';

interface ProjectsState {
    projects: ProjectState[];
    currentProjectId: string | null;
}

const initialState: ProjectsState = {
    projects: [],
    currentProjectId: null,
};

const projectsSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        addProject: (state, action: PayloadAction<ProjectState>) => {
            state.projects.push(action.payload);
            state.currentProjectId = action.payload.id;
        },
        updateProject: (state, action: PayloadAction<ProjectState>) => {
            const index = state.projects.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.projects[index] = action.payload;
            }
        },
        deleteProject: (state, action: PayloadAction<string>) => {
            state.projects = state.projects.filter(p => p.id !== action.payload);
            if (state.currentProjectId === action.payload) {
                state.currentProjectId = state.projects.length > 0 ? state.projects[0].id : null;
            }
        },
        setCurrentProject: (state, action: PayloadAction<string>) => {
            state.currentProjectId = action.payload;
        },
        rehydrateProjects: (state, action: PayloadAction<ProjectState[]>) => {
            state.projects = action.payload;
        },
    },
});

export const {
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    rehydrateProjects,
} = projectsSlice.actions;

export default projectsSlice.reducer; 