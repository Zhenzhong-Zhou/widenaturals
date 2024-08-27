import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Typography, Container, Paper, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { InputField } from "../../index";
import employeeFormStyles from './EmployeeFormStyles';

const EmployeeForm = ({ title, onSubmit, fields }) => {
    const theme = useTheme();
    const styles = employeeFormStyles(theme);
    const { enqueueSnackbar } = useSnackbar();
    
    const [formData, setFormData] = useState(
        fields.reduce((acc, field) => {
            acc[field.name] = field.name === 'phone_number' ? '(000)-000-0000' : '';
            return acc;
        }, { confirm_password: '' })
    );
    
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'phone_number') {
            // Remove all non-digit characters
            let digits = value.replace(/\D/g, '');
            
            // Limit input to a maximum of 10 digits
            if (digits.length > 10) {
                digits = digits.slice(0, 10);
            }
            let formattedValue = digits;
            if (digits.length > 6) {
                formattedValue = `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
            } else if (digits.length > 3) {
                formattedValue = `(${digits.slice(0, 3)})-${digits.slice(3)}`;
            } else if (digits.length > 0) {
                formattedValue = `(${digits}`;
            }
            
            setFormData({
                ...formData,
                [name]: formattedValue,
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
        
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }
    };
    
    const validate = () => {
        let tempErrors = {};
        fields.forEach((field) => {
            if (field.required && !formData[field.name]) {
                tempErrors[field.name] = `${field.label} is required`;
            }
        });
        
        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:;<>,.?~\-=\[\]\\|]).{18,64}$/;
        if (!passwordRegex.test(formData.password)) {
            tempErrors.password = 'Password must be 18-64 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.';
        }
        
        // Confirm password validation
        if (formData.password !== formData.confirm_password) {
            tempErrors.confirm_password = 'Passwords do not match';
        }
        
        // Job title validation
        const jobTitleRegex = /^[A-Z][a-z]*(\s[A-Z][a-z]*)*$/;
        if (!jobTitleRegex.test(formData.job_title)) {
            tempErrors.job_title = 'Job title must start with an uppercase letter and only contain letters, with each word starting with an uppercase letter.';
        }
        
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData)
                .catch((error) => {
                    // Display server-side validation errors
                    if (error.response && error.response.data && error.response.data.errors) {
                        setErrors(error.response.data.errors);
                    } else {
                        enqueueSnackbar('An unexpected error occurred.', { variant: 'error' });
                    }
                });
        }
    };
    
    return (
        <Container maxWidth="sm">
            <Paper sx={styles.paper}>
                <Typography variant="h5" component="h1" gutterBottom>
                    {title}
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
                    {fields.map((field) => (
                        <InputField
                            key={field.name}
                            name={field.name}
                            label={field.label}
                            type={field.type === 'password' ? (field.name === 'password' && showPassword ? 'text' : 'password') : field.type}
                            value={formData[field.name]}
                            onChange={handleChange}
                            required={field.required}
                            error={!!errors[field.name]}
                            helperText={errors[field.name] || (field.name === 'password' && !errors.password ? 'Password must be 18-64 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.' : field.name === 'job_title' && !errors.job_title ? 'Job title must start with an uppercase letter and only contain letters, with each word starting with an uppercase letter.' : '')}
                            sx={styles.input}
                            InputProps={field.type === 'password' ? {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => field.name === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                        >
                                            {(field.name === 'password' ? showPassword : showConfirmPassword) ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            } : null}
                        />
                    ))}
                    <InputField
                        name="confirm_password"
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        error={!!errors.confirm_password}
                        helperText={errors.confirm_password}
                        sx={styles.input}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={styles.submitButton}>
                        {title}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default EmployeeForm;