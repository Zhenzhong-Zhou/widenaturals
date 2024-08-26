import {createSlice} from '@reduxjs/toolkit';
import {checkAuthStatus, loginEmployee} from '../thunks/loginThunk';

const initialState = {
    sessionId: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthState(state) {
            state.sessionId = null;
            state.isAuthenticated = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginEmployee.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginEmployee.fulfilled, (state, action) => {
                if (action.payload && action.payload.hashedID) {
                    state.sessionId = action.payload.hashedID; // Store the hashed session ID
                } else {
                    state.sessionId = null; // Clear it if not provided
                }
                state.isAuthenticated = true;
                state.isLoading = false;
                state.error = null;  // Clear any previous error
            })
            .addCase(loginEmployee.rejected, (state, action) => {
                state.error = { message: 'Login failed' }; // Generalize error message
                state.isLoading = false;
                state.isAuthenticated = false;
                state.sessionId = null;
            })
            .addCase(checkAuthStatus.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                if (action.payload && action.payload.hashedID) {
                    state.isAuthenticated = true;
                    state.sessionId = action.payload.hashedID; // Store the hashed session ID
                } else {
                    state.isAuthenticated = false;
                    state.sessionId = null; // Ensure this is cleared if not authenticated
                }
                state.isLoading = false;
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.error = { message: 'Check failed' }; // Generalize error message
                state.isAuthenticated = false;
                state.isLoading = false;
            });
    },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;