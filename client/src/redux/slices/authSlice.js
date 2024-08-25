import { createSlice } from '@reduxjs/toolkit';
import { loginEmployee, checkAuthStatus } from '../thunks/loginThunk';

const initialState = {
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthState(state) {
            state.isAuthenticated = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginEmployee.pending, (state) => {
                state.isLoading = true;
                state.error = null;  // Reset error state on new request
            })
            .addCase(loginEmployee.fulfilled, (state) => {
                state.isAuthenticated = true;
                state.isLoading = false;
                state.error = null;  // Clear any previous error
            })
            .addCase(loginEmployee.rejected, (state, action) => {
                state.error = action.payload;  // Set error from action payload
                state.isLoading = false;
                state.isAuthenticated = false;  // Ensure isAuthenticated is false on failure
            })
            .addCase(checkAuthStatus.pending, (state) => {
                state.isLoading = true;
                state.error = null;  // Reset error state on new request
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                if (action.payload && action.payload.hashedID) {
                    state.isAuthenticated = true;
                } else {
                    state.isAuthenticated = false;
                }
                state.isLoading = false;
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.error = action.payload;  // Set error from action payload
                state.isAuthenticated = false;  // Ensure isAuthenticated is false on failure
                state.isLoading = false;
            });
    },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;