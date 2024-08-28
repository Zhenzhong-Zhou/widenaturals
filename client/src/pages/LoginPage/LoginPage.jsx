import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { InputField, LoadingSpinner } from "../../components";
import loginPageStyles from './LoginPageStyles';

const LoginPage = ({ formData, loading, loginError, handleInputChange, handleLogin }) => {
    const theme = useTheme();
    const styles = loginPageStyles(theme);
    
    const inputFields = [
        { label: 'Email', type: 'email', name: 'email', required: true },
        { label: 'Password', type: 'password', name: 'password', required: true }
    ];
    
    return (
        <Container maxWidth="sm" sx={styles.container}>
            <Paper elevation={3} sx={styles.paper}>
                <Typography variant="h6" component="div" sx={styles.companyName}>
                    WIDE Naturals INC
                </Typography>
                <Typography variant="h4" component="h1" gutterBottom sx={styles.title}>
                    Login
                </Typography>
                <Box component="form" onSubmit={handleLogin} aria-busy={loading} sx={styles.form}>
                    {inputFields.map(({ label, type, name, required }) => (
                        <InputField
                            key={name}
                            label={label}
                            type={type}
                            name={name}
                            value={formData[name] || ''}
                            onChange={handleInputChange}
                            required={required}
                            validateEmail={true}
                            aria-label={label}
                        />
                    ))}
                    <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
                        {loading ? (
                            <LoadingSpinner message={"Loading..."} />
                        ) : (
                            <Button type="submit" variant="contained" color="primary" fullWidth sx={styles.submitButton}>
                                Login
                            </Button>
                        )}
                    </Box>
                    {loginError && (
                        <Typography variant="body2" color="error" align="center" sx={styles.errorText}>
                            {loginError}
                        </Typography>
                    )}
                </Box>
                <Box mt={4} textAlign="center">
                    <Typography variant="body2" color="textSecondary">
                        &copy; 2022 - {new Date().getFullYear()} WIDE Naturals INC. All rights reserved.
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Developed by [Zhenzhong 'Bob' Zhou]
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage;