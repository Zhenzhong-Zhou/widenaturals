import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { loginThunk } from '../../redux/thunks/authThunk';
import {LoginPage} from "../../pages";
import {selectLoading} from "../../redux/selectors/authSelectors";

const LoginContainer = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const isLoading = useSelector(selectLoading);
    const loginError = useSelector((state) => state.employee.loginError);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    
    const handleLogin = async (e) => {
        e.preventDefault();
        const result = await dispatch(loginThunk(formData));
        
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
            isLoading={isLoading}
            loginError={loginError}
            handleInputChange={handleInputChange}
            handleLogin={handleLogin}
        />
    );
};

export default LoginContainer;