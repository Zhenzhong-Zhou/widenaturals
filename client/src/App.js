import {lazy, Suspense, useEffect} from 'react';
import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import useNotification from './hooks/useNotification';
import ErrorBoundary from './components/ErrorBoundary';
import {checkAuthStatus} from "./redux/thunks/loginThunk";
import LoadingSpinner from "./components/LoadingSpinner";
import LoginPage from "./pages/LoginPage";
import {selectIsAuthenticated, selectLoading} from "./redux/selectors/authSelectors";
import AdminCreationPage from "./pages/AdminCreationPage";

const LazyRoutes = lazy(() => import('./routes'));

const App = () => {
    const { notificationElement } = useNotification();
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isLoading = useSelector(selectLoading);
    
    useEffect(() => {
        dispatch(checkAuthStatus());
    }, []);
    
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