import { createSlice } from '@reduxjs/toolkit';
import { retrieveEmployeeProfile } from '../thunks/employeeProfileThunk';

const initialState = {
    full_name: '', // Updated to match API response
    email: '',
    phone_number: '', // Updated to match API response
    job_title: '', // Updated to match API response
    role_name: '', // Updated to match API response
    created_at: '', // Updated to match API response
    updated_at: '', // Updated to match API response
    last_login: '', // Updated to match API response
    status: '',
    two_factor_enabled: false, // Updated to match API response
    metadata: null, // Updated to match API response
    image_path: null, // Updated to match API response
    thumbnail_path: null, // Updated to match API response
    alt_text: null, // Updated to match API response
    isLoading: false,
    error: null,
};

const employeeProfileSlice = createSlice({
    name: 'employeeProfile',
    initialState,
    reducers: {
        clearEmployeeProfileState(state) {
            state.full_name = '';
            state.email = '';
            state.phone_number = '';
            state.job_title = '';
            state.role_name = '';
            state.created_at = '';
            state.updated_at = '';
            state.last_login = '';
            state.status = '';
            state.two_factor_enabled = false;
            state.metadata = null;
            state.image_path = null;
            state.thumbnail_path = null;
            state.alt_text = null;
            state.isLoading = false;
            state.error = null;
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
                
                const {
                    full_name, email, phone_number, job_title, role_name,
                    created_at, updated_at, last_login, status, two_factor_enabled,
                    metadata, image_path, thumbnail_path, alt_text
                } = action.payload;
                
                state.full_name = full_name;
                state.email = email;
                state.phone_number = phone_number;
                state.job_title = job_title;
                state.role_name = role_name;
                state.created_at = created_at;
                state.updated_at = updated_at;
                state.last_login = last_login;
                state.status = status;
                state.two_factor_enabled = two_factor_enabled;
                state.metadata = metadata;
                state.image_path = image_path;
                state.thumbnail_path = thumbnail_path;
                state.alt_text = alt_text;
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