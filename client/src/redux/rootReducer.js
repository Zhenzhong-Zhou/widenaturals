import {combineReducers} from '@reduxjs/toolkit';
import initAdminReducer from './slices/initAdminSlice';
import authReducer from './slices/authSlice';
import employeeReducer from './slices/employeeSlice';
// import settingsReducer from './slices/settingsSlice';

// Define appReducer with all your slices
const appReducer = combineReducers({
    initAdmin: initAdminReducer,
    auth: authReducer,
    employee: employeeReducer,
    // settings: settingsReducer,
    // Add more reducers here
});

// Enhance rootReducer to handle `persist/REHYDRATE` action
const rootReducer = (state, action) => {
    if (action.type === 'persist/REHYDRATE') {
        // Handle rehydration and set isLoading to false
        const { auth, ...restState } = state || {};
        return {
            ...restState,
            auth: {
                ...auth,
                isLoading: false, // Explicitly reset isLoading
            },
        };
    }
    
    // Use appReducer for other actions
    return appReducer(state, action);
};

export default rootReducer;