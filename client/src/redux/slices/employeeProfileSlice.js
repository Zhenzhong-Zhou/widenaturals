import { createSlice } from '@reduxjs/toolkit';
import { retrieveEmployeeProfile } from '../thunks/employeeProfileThunk';

const initialState = {
    full_name: '',
    email: '',
    phone_number: '',
    job_title: '',
    role_name: '',
    created_at: '',
    updated_at: '',
    last_login: '',
    status: '',
    two_factor_enabled: false,
    metadata: null,
    image_path: null,
    thumbnail_path: null,
    alt_text: null,
    isLoading: false,
    error: null,
};

const employeeProfileSlice = createSlice({
    name: 'employeeProfile',
    initialState,
    reducers: {
        clearEmployeeProfileState(state) {
            // Reset state to initial state more concisely
            return Object.assign(state, initialState);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(retrieveEmployeeProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(retrieveEmployeeProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                
                // Update the state with the payload from fulfilled action
                Object.assign(state, action.payload);
            })
            .addCase(retrieveEmployeeProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

// Export the clear action correctly
export const { clearEmployeeProfileState } = employeeProfileSlice.actions;

export default employeeProfileSlice.reducer;