import {configureStore} from '@reduxjs/toolkit';
import {persistReducer, persistStore} from 'redux-persist';
import sessionStorage from 'redux-persist/lib/storage/session'; // Use sessionStorage instead of localStorage
import rootReducer from './rootReducer';
import logger from 'redux-logger';

// Create a persist config
const persistConfig = {
    key: 'root',
    storage: sessionStorage,  // Use sessionStorage for persisting the state
    whitelist: ['auth'] // Only persist the 'auth' slice
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Middleware configuration
const middleware = (getDefaultMiddleware) => {
    return getDefaultMiddleware({
        serializableCheck: {
            // Ignore these action types because they are internal to redux-persist
            ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
        },
    }).concat(process.env.NODE_ENV === 'development' ? logger : []);
};

// Configure the store with the persisted reducer
const store = configureStore({
    reducer: persistedReducer,
    middleware,
});

// Create a persistor
const persistor = persistStore(store);

export { store, persistor };