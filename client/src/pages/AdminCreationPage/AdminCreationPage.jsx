import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';
import { Box, Button, TextField, Typography } from "@mui/material";
import { createAdmin } from "../../redux/thunks/initAdminThunk";
import {EmployeeFormContainer} from "../../containers";

const AdminCreationPage = ({ isAuthenticated, allowWithoutLogin }) => {
    const [password, setPassword] = useState('');
    const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    
    const adminFields = [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone_number', label: 'Phone Number', type: 'text', required: true },
        { name: 'job_title', label: 'Job Title', type: 'text', required: true },
        { name: 'role_name', label: 'Role Name', type: 'text', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
    ];
    
    const handlePasswordCheck = () => {
        if (password === process.env.REACT_APP_ADMIN_SETUP_PASSWORD) {
            setIsPasswordCorrect(true);
        } else {
            enqueueSnackbar('Incorrect password. Please try again.', { variant: 'error' });
        }
    };
    
    if (!isAuthenticated && allowWithoutLogin && !isPasswordCorrect) {
        return (
            <Box sx={{ textAlign: 'center', marginTop: '20vh' }}>
                <Typography variant="h6">Please enter the setup password:</Typography>
                <TextField
                    type="password"
                    label="Setup Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ marginTop: 2 }}
                />
                <Button variant="contained" color="primary" onClick={handlePasswordCheck} sx={{ marginTop: 2 }}>
                    Submit
                </Button>
            </Box>
        );
    }
    
    const handleAdminCreation = async (formData) => {
        try {
            await dispatch(createAdmin(formData)).unwrap();
            navigate('/login');
            enqueueSnackbar('Admin created successfully!', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('An error occurred while creating the admin.', { variant: 'error' });
        }
    };
    
    return (
        <EmployeeFormContainer
            title="Create Admin"
            onSubmit={handleAdminCreation}
            fields={adminFields}
        />
    );
};

export default AdminCreationPage;