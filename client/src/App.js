import { Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import {closeSnackbar, SnackbarProvider} from "notistack";
import Button from "@mui/material/Button";
import { darkMode, lightMode } from "./styles/theme";
import useNotification from './hooks/useNotification';
import { ErrorBoundary, LoadingSpinner } from "./components";
import { checkAuthStatus } from './redux/thunks/authThunk';
import {selectIsAuthenticated, selectAuthIsLoading} from './redux/selectors/authSelectors';
import AppRoutes from './routes';

const App = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { notificationElement } = useNotification();
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isLoading = useSelector(selectAuthIsLoading);
    const [isAuthCheckInitiated, setIsAuthCheckInitiated] = useState(false);
    
    useEffect(() => {
        const savedThemePreference = localStorage.getItem('theme');
        if (savedThemePreference) {
            setIsDarkMode(savedThemePreference === 'dark');
        } else {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDarkMode);
        }
    }, []);
    
    const toggleTheme = () => {
        setIsDarkMode((prevMode) => {
            const newMode = !prevMode;
            localStorage.setItem('theme', newMode ? 'dark' : 'light');
            return newMode;
        });
    };
    
    const theme = useMemo(() => (isDarkMode ? darkMode : lightMode), [isDarkMode]);
    //
    // useEffect(() => {
    //     const checkAuth = async () => {
    //         const lastCheck = sessionStorage.getItem('laC');
    //         const now = Date.now();
    //         if ((!lastCheck || now - lastCheck > 30000) && !isAuthenticated && !isAuthCheckInitiated && !isLoading) {
    //             await dispatch(checkAuthStatus());
    //             setIsAuthCheckInitiated(true);
    //             sessionStorage.setItem('laC', now.toString());
    //         }
    //     };
    //
    //     const handler = setTimeout(() => {
    //         checkAuth().catch((error) => {console.error('Error during authentication check:', error);});
    //     }, 500);
    //
    //     return () => clearTimeout(handler);
    // }, [dispatch, isAuthenticated, isAuthCheckInitiated, isLoading]);
    
    return (
        <ThemeProvider theme={theme}>
            <SnackbarProvider maxSnack={3} autoHideDuration={5000} action={(key) => (
                <Button onClick={() => closeSnackbar(key)} color="inherit">
                    Close
                </Button>
            )}>
                <ErrorBoundary>
                    <Router>
                        <Suspense fallback={<LoadingSpinner message="Loading, please wait..." />}>
                            <AppRoutes toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />
                        </Suspense>
                        {notificationElement}
                    </Router>
                </ErrorBoundary>
            </SnackbarProvider>
        </ThemeProvider>
    );
};

export default App;