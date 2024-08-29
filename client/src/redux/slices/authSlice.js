import {createSlice} from '@reduxjs/toolkit';
import {checkAuthStatus, loginThunk, logoutThunk} from '../thunks/authThunk';

const initialState = {
    sessionId: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};
console.log('Initial State:', initialState);
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthState(state) {
            state.sessionId = null;
            state.isAuthenticated = false;
            state.error = null;
            state.isLoading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                if (action.payload && action.payload.hashedID) {
                    state.sessionId = action.payload.hashedID;
                } else {
                    state.sessionId = null;
                }
                state.isAuthenticated = true;
                state.isLoading = false;
                state.error = null;
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.error = { message: 'Login failed' };
                state.isLoading = false;
                state.isAuthenticated = false;
                state.sessionId = null;
            })
            .addCase(checkAuthStatus.pending, (state) => {
                console.log('Auth check initiated, setting isLoading to true');
                state.isLoading = true;
                state.error = null;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                if (action.payload && action.payload.hashedID) {
                    state.isAuthenticated = true;
                    state.sessionId = action.payload.hashedID;
                } else {
                    state.isAuthenticated = false;
                    state.sessionId = null;
                }
                state.isLoading = false;
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.error = { message: 'Check failed' };
                state.isAuthenticated = false;
                state.isLoading = false;
            })
            .addCase(logoutThunk.pending, (state, action) => {
                state.isLoading = true;
            })
            .addCase(logoutThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.sessionId = null;
                state.error = null;
            })
            .addCase(logoutThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { message: 'Logout failed' };
            });
    },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;