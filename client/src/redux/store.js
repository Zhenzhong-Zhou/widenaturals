import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import rootReducer from './rootReducer';
import logger from 'redux-logger';

// Create a persist config
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth'] // Only persist the 'auth' slice
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Middleware configuration
const middleware = (getDefaultMiddleware) => {
    if (process.env.NODE_ENV === 'development') {
        return getDefaultMiddleware().concat(logger);
    }
    return getDefaultMiddleware();
};

// Configure the store with the persisted reducer
const store = configureStore({
    reducer: persistedReducer,
    middleware,
});

// Create a persistor
const persistor = persistStore(store);

export { store, persistor };