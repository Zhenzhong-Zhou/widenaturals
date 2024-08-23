import {lazy, Suspense} from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import useNotification from './hooks/useNotification';
import ErrorBoundary from './components/ErrorBoundary';

// todo not wrap routes:  a login page or critical admin dashboard
// Lazy load the Routes component
const LazyRoutes = lazy(() => import('./routes'));

const App = () => {
    const { notificationElement, showNotification } = useNotification();
    
    return (
        <ThemeProvider theme={theme}>
            <ErrorBoundary>
                <Suspense fallback={<div>Loading...</div>}>
                    <LazyRoutes />
                </Suspense>
                {notificationElement}
            </ErrorBoundary>
        </ThemeProvider>
    );
};

export default App;