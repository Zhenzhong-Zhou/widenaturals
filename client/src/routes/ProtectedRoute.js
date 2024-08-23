import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ element: Element, permissions, ...rest }) => {
    const userPermissions = useSelector((state) => state.user.permissions);
    
    const hasPermission = permissions.some((perm) => userPermissions.includes(perm));
    
    return hasPermission ? <Element {...rest} /> : <Navigate to="/unauthorized" />;
};

export default ProtectedRoute;