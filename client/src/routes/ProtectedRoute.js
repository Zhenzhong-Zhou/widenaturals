import React from 'react';
import {Navigate} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {selectIsAuthenticated} from '../redux/selectors/authSelectors'; // Adjust the path as needed

const ProtectedRoute = ({ element: Component, allowWithoutLogin = false, ...rest }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    
    if (allowWithoutLogin) {
        return <Component {...rest} />;
    }
    
    return isAuthenticated ? <Component {...rest} /> : <Navigate to="/login" />;
};

export default ProtectedRoute;