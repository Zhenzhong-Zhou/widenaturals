import {StrictMode} from "react";
import ReactDOM from 'react-dom/client';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import { SnackbarProvider } from 'notistack';
import {persistor, store} from './redux/store'; // Import the Redux store
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <SnackbarProvider maxSnack={3}>
                    <App />
                </SnackbarProvider>
            </PersistGate>
        </Provider>
    </StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();