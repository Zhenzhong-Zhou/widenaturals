import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import useNotification from './hooks/useNotification';
import ErrorBoundary from './components/ErrorBoundary';
import { checkAuthStatus } from './redux/thunks/loginThunk';
import { selectIsAuthenticated, selectLoading } from './redux/selectors/authSelectors';
import LoadingSpinner from './components/LoadingSpinner';
import LoginPage from './pages/LoginPage';
import AdminCreationPage from './pages/AdminCreationPage';

const LazyRoutes = lazy(() => import('./routes'));

const App = () => {
    const { notificationElement } = useNotification();
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isLoading = useSelector(selectLoading);
    const [isAuthCheckInitiated, setIsAuthCheckInitiated] = useState(false); // Track auth check initiation
    
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
        
        return () => clearTimeout(handler); // Cleanup on component unmount or dependency change
    }, [dispatch, isAuthenticated, isAuthCheckInitiated]);
    
    if (isLoading) {
        return <LoadingSpinner message="Loading, please wait..." />;
    }
    
    return (
        <ThemeProvider theme={theme}>
            <ErrorBoundary>
                <Router>
                    <Suspense fallback={<LoadingSpinner message="Loading, please wait..." />}>
                        <Routes>
                            {!isAuthenticated && (
                                <>
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/public" element={<AdminCreationPage allowWithoutLogin={true} />} />
                                    <Route path="*" element={<Navigate to="/login" />} />
                                </>
                            )}
                            {isAuthenticated && (
                                <>
                                    <Route path="*" element={<LazyRoutes />} />
                                </>
                            )}
                        </Routes>
                    </Suspense>
                    {notificationElement}
                </Router>
            </ErrorBoundary>
        </ThemeProvider>
    );
};

export default App;