import {combineReducers} from '@reduxjs/toolkit';
import employeeReducer from './slices/employeeSlice';
import authReducer from './slices/authSlice';
// import settingsReducer from './slices/settingsSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    employee: employeeReducer,
    // settings: settingsReducer,
    // Add more reducers here
});

export default rootReducer;