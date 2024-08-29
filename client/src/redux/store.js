import { configureStore } from '@reduxjs/toolkit';
import {createTransform, persistReducer, persistStore} from 'redux-persist';
import sessionStorage from 'redux-persist/lib/storage/session';
import rootReducer from './rootReducer';
import logger from 'redux-logger';

// Transform to exclude `isLoading` from being persisted
const authTransform = createTransform(
    (inboundState) => {
        // Exclude `isLoading` from the persisted state
        const { isLoading, ...rest } = inboundState;
        return rest;
    },
    (outboundState) => {
        // Simply return the state on rehydration
        return outboundState;
    },
    { whitelist: ['auth'] } // Apply transform only to 'auth' slice
);

// Create a persist config
const persistConfig = {
    key: 'root',
    storage: sessionStorage, // Use sessionStorage for persisting the state
    whitelist: ['auth'], // Only persist the 'auth' slice
    transforms: [authTransform], // Apply the transform to exclude `isLoading`
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Middleware configuration
const middleware = (getDefaultMiddleware) =>
    getDefaultMiddleware({
        serializableCheck: {
            // Ignore these action types because they are internal to redux-persist
            ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
        },
    }).concat(process.env.NODE_ENV === 'development' ? logger : []);

// Configure the store with the persisted reducer
const store = configureStore({
    reducer: persistedReducer,
    middleware,
});

// Create a persistor
const persistor = persistStore(store);

export { store, persistor };