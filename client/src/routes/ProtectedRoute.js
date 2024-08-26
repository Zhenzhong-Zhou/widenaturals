import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../redux/selectors/authSelectors';

const ProtectedRoute = ({ permissions = [], allowWithoutLogin = false }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    
    if (!isAuthenticated && !allowWithoutLogin) {
        // User is not authenticated and the route doesn't allow access without login
        return <Navigate to="/login" />;
    }
    
    // If authenticated or the route allows access without login, render the Outlet
    return <Outlet />;
};

export default ProtectedRoute;