import { Box, Button, Typography, Container, Paper} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { InputField } from "../../components";
import employeeFormStyles from './EmployeeFormStyles';

const EmployeeForm = ({
                          title,
                          formData,
                          handleChange,
                          handleSubmit,
                          fields,
                          showPassword,
                          showConfirmPassword,
                          errors
                      }) => {
    const theme = useTheme();
    const styles = employeeFormStyles(theme);
    
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
                            helperText={errors[field.name]}
                            sx={styles.input}
                            autoComplete={
                                field.name === 'email' ? 'email' :
                                    field.name === 'password' ? 'current-password' :
                                        field.name === 'new-password' ? 'new-password' :
                                            undefined
                            }
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
                        autoComplete="new-password"
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