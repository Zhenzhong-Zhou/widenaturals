import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Typography } from '@mui/material';
import { loginEmployee } from '../redux/thunks/loginThunk';
import useNotification from '../hooks/useNotification';
import FormInput from '../components/FormInput';
import SubmitButton from '../components/SubmitButton';
import {useNavigate} from "react-router-dom";

const LoginPage = () => {
    const dispatch = useDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const loginError = useSelector((state) => state.employee.loginError);
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    
    const handleLogin = async (e) => {
        e.preventDefault();
        const credentials = { email, password };
        const result = await dispatch(loginEmployee(credentials));
        
        if (loginEmployee.fulfilled.match(result)) {
            showNotification('Login successful!', 'success');
            navigate('/');
        } else {
            showNotification('Login failed. Please check your credentials.', 'error');
        }
    };
    
    return (
        <Container maxWidth="sm">
            <Typography variant="h4" component="h1" gutterBottom>
                Login
            </Typography>
            <form onSubmit={handleLogin}>
                <FormInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <FormInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <SubmitButton label="Login" />
                {loginError && (
                    <Typography variant="body2" color="error" align="center" marginTop="1rem">
                        {loginError}
                    </Typography>
                )}
            </form>
        </Container>
    );
};

export default LoginPage;