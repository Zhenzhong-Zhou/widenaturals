import { createSlice } from '@reduxjs/toolkit';
import { retrieveEmployeeProfile } from '../thunks/employeeProfileThunk';

const initialState = {
    profile: null,
    isLoading: false,
    error: null,
};

const employeeProfileSlice = createSlice({
    name: 'employeeProfile',
    initialState,
    reducers: {
        clearEmployeeProfileState() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(retrieveEmployeeProfile.pending, (state) => {
                return {
                    ...initialState, // Reset state to initial state while keeping isLoading true
                    isLoading: true,
                };
            })
            .addCase(retrieveEmployeeProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null; // Reset error on successful fetch
                // Store the entire payload inside `profile`
                state.profile = action.payload;
            })
            .addCase(retrieveEmployeeProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Failed to fetch profile';
            });
    },
});

export const { clearEmployeeProfileState } = employeeProfileSlice.actions;

export default employeeProfileSlice.reducer;