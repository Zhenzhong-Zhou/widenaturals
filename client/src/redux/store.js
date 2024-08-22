import { configureStore } from '@reduxjs/toolkit';
import employeeReducer from './userSlice';

const store = configureStore({
    reducer: {
        employee: employeeReducer,
    },
});

export default store;