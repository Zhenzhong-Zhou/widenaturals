import {useRef, useState} from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Typography, Container, Paper, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useSnackbar } from "notistack";
import { InputField } from "../../index";
import employeeFormStyles from './EmployeeFormStyles';

const EmployeeForm = ({ title, onSubmit, fields }) => {
    const theme = useTheme();
    const styles = employeeFormStyles(theme);
    const { enqueueSnackbar } = useSnackbar();
    const phoneInputRef = useRef(null);
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
            const inputElement = e.target;
            let cursorPosition = inputElement.selectionStart;
            
            // Remove all non-digit characters
            let cleanedValue = value.replace(/\D/g, '');
            
            // // Limit to 10 characters max and pad with zeros if less than 10
            cleanedValue = cleanedValue.slice(0, 10).padEnd(10, '0');
            
            // Format according to (000)-000-0000
            const formattedValue = `(${cleanedValue.slice(0, 3)})-${cleanedValue.slice(3, 6)}-${cleanedValue.slice(6, 10)}`;
            
            setFormData({
                ...formData,
                [name]: formattedValue,
            });
            
            // Adjust cursor position logic
            setTimeout(() => {
                if (cursorPosition <= 4) {
                    cursorPosition = Math.min(cursorPosition, 4);  // Stay after "("
                } else if (cursorPosition <= 8) {
                    cursorPosition = Math.min(cursorPosition + 1, 9);  // Stay after "-"
                } else {
                    cursorPosition = Math.min(cursorPosition, formattedValue.length);  // Stay after the second "-"
                }
                inputElement.setSelectionRange(cursorPosition, cursorPosition);
            }, 0);
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
        
        // Clear error for the field being updated
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
        
        if (formData.password !== formData.confirm_password) {
            tempErrors.confirm_password = 'Passwords do not match';
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
                            type={field.type ? 'text' : 'tel'}
                            value={formData[field.name]}
                            onChange={handleChange}
                            required={field.required}
                            error={!!errors[field.name]}
                            helperText={errors[field.name]}
                            sx={styles.input}
                            inputRef={field.name === 'phone_number' ? phoneInputRef : null}
                            InputProps={field.type === 'password' ? {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
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