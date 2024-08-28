import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { loginThunk } from '../../redux/thunks/authThunk';
import {LoginPage} from "../../pages";

const LoginContainer = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const loginError = useSelector((state) => state.employee.loginError);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await dispatch(loginThunk(formData));
        setLoading(false);
        
        if (loginThunk.fulfilled.match(result)) {
            enqueueSnackbar('Login successful!', { variant: 'success' });
            navigate('/');
        } else {
            enqueueSnackbar(result.error?.message || 'Login failed. Please check your credentials.', { variant: 'error' });
        }
    };
    
    // Pass necessary props to the presentational component
    return (
        <LoginPage
            formData={formData}
            loading={loading}
            loginError={loginError}
            handleInputChange={handleInputChange}
            handleLogin={handleLogin}
        />
    );
};

export default LoginContainer;