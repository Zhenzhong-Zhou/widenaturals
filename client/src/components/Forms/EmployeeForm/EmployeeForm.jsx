import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { InputField } from "../../index";
import employeeFormStyles from './EmployeeFormStyles';

const EmployeeForm = ({ title, onSubmit, fields }) => {
    const theme = useTheme();
    const styles = employeeFormStyles(theme);
    
    // Initialize formData with fields and include confirmPassword
    const [formData, setFormData] = useState(
        fields.reduce((acc, field) => {
            acc[field.name] = '';
            return acc;
        }, { confirm_password: '' }) // Add confirmPassword to the initial state
    );
    
    const [errors, setErrors] = useState({});
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    
    const validate = () => {
        let tempErrors = {};
        fields.forEach((field) => {
            if (field.required && !formData[field.name]) {
                tempErrors[field.name] = `${field.label} is required`;
            }
        });
        
        if (formData.password !== formData.confirm_password) {
            tempErrors.confirmPassword = 'Passwords do not match';
        }
        
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
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
                            type={field.type}
                            value={formData[field.name]}
                            onChange={handleChange}
                            required={field.required}
                            error={!!errors[field.name]}
                            helperText={errors[field.name]}
                            sx={styles.input}
                        />
                    ))}
                    <InputField
                        name="confirm_password"
                        label="Confirm Password"
                        type="password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        sx={styles.input}
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