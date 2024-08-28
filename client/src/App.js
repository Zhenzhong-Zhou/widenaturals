import { Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { darkMode, lightMode } from "./styles/theme";
import useNotification from './hooks/useNotification';
import { ErrorBoundary, LoadingSpinner } from "./components";
import { checkAuthStatus } from './redux/thunks/loginThunk';
import { selectIsAuthenticated, selectLoading } from './redux/selectors/authSelectors';
import AppRoutes from './routes';

const App = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { notificationElement } = useNotification();
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isLoading = useSelector(selectLoading);
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
    
    useEffect(() => {
        const handler = setTimeout(() => {
            const lastCheck = sessionStorage.getItem('laC');
            const now = Date.now();
            if ((!lastCheck || now - lastCheck > 30000) && !isAuthenticated && !isAuthCheckInitiated) {
                dispatch(checkAuthStatus());
                setIsAuthCheckInitiated(true);
                sessionStorage.setItem('laC', now);
            }
        }, 500); // Debounce delay
        
        return () => clearTimeout(handler);
    }, [dispatch, isAuthenticated, isAuthCheckInitiated]);
    
    if (isLoading) {
        return <LoadingSpinner message="Loading, please wait..." />;
    }
    
    return (
        <ThemeProvider theme={theme}>
            <ErrorBoundary>
                <Router>
                    <Suspense fallback={<LoadingSpinner message="Loading, please wait..." />}>
                        <AppRoutes toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />
                    </Suspense>
                    {notificationElement}
                </Router>
            </ErrorBoundary>
        </ThemeProvider>
    );
};

export default App;