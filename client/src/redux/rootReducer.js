import {combineReducers} from '@reduxjs/toolkit';
import initAdminReducer from './slices/initAdminSlice';
import authReducer from './slices/authSlice';
import employeeReducer from './slices/employeeSlice';
// import settingsReducer from './slices/settingsSlice';

const rootReducer = combineReducers({
    initAdmin: initAdminReducer,
    auth: authReducer,
    employee: employeeReducer,
    // settings: settingsReducer,
    // Add more reducers here
});

export default rootReducer;