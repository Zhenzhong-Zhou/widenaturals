import { createSlice } from '@reduxjs/toolkit';
import { retrieveEmployeeProfile } from '../thunks/employeeProfileThunk';

const initialState = {
    profile: null,
    profileImagePath: null,
    thumbnailPath: null,
    isLoading: false,
    error: null,
};

const employeeProfileSlice = createSlice({
    name: 'employeeProfile',
    initialState,
    reducers: {
        clearEmployeeProfileState(state) {
            // Reset state to initial state more concisely
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
                
                // Base URL for constructing full image paths
                const baseImageURL = process.env.REACT_APP_BASE_IMAGE_URL;
                
                // Construct the full profile image and thumbnail paths
                const profileImagePath = action.payload.image_path
                    ? `${baseImageURL}/${action.payload.image_path}`
                    : null;
                
                const thumbnailPath = action.payload.thumbnail_path
                    ? `${baseImageURL}/${action.payload.thumbnail_path}`
                    : null;
                
                // Update the state with the payload and the constructed image paths
                // state.profile = action.payload;
                state.profileImagePath = profileImagePath;
                state.thumbnailPath = thumbnailPath;
                Object.assign(state, action.payload);
            })
            .addCase(retrieveEmployeeProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Failed to fetch profile';
            });
    },
});

// Export the clear action correctly
export const { clearEmployeeProfileState } = employeeProfileSlice.actions;

export default employeeProfileSlice.reducer;