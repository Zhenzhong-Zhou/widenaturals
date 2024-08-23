import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import logger from 'redux-logger';

const middleware = (getDefaultMiddleware) => {
    if (process.env.NODE_ENV === 'development') {
        return getDefaultMiddleware().concat(logger);
    }
    return getDefaultMiddleware();
};

const store = configureStore({
    reducer: rootReducer,
    middleware,
});

export default store;