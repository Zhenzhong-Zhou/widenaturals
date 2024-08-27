import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import {InputField} from "../../index";
import employeeFormStyles from './EmployeeFormStyles';

const SharedForm = ({ title, onSubmit, fields }) => {
    const theme = useTheme();
    const styles = employeeFormStyles(theme);
    
    const [formData, setFormData] = useState(
        fields.reduce((acc, field) => {
            acc[field.name] = '';
            return acc;
        }, {})
    );
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
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
                            sx={styles.input}
                        />
                    ))}
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={styles.submitButton}>
                        {title}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default SharedForm;