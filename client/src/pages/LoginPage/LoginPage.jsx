import { Container, Typography, Box } from '@mui/material';
import {InputField, LoadingSpinner} from "../../components";
import SubmitButton from "../../components/SubmitButton";

const LoginPage = ({ formData, loading, loginError, handleInputChange, handleLogin }) => {
    const inputFields = [
        { label: 'Email', type: 'email', name: 'email', required: true },
        { label: 'Password', type: 'password', name: 'password', required: true }
    ];
    
    return (
        <Container maxWidth="sm">
            <Typography variant="h4" component="h1" gutterBottom>
                Login
            </Typography>
            <Box component="form"  onSubmit={handleLogin} aria-busy={loading}>
                {/* Loop over inputFields array to render InputField components */}
                {inputFields.map(({ label, type, name, required }) => (
                    <InputField
                        key={name}
                        label={label}
                        type={type}
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleInputChange}
                        required={required}
                    />
                ))}
                <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
                    {loading ? (
                        <LoadingSpinner message={"Loading..."} />
                    ) : (
                        <SubmitButton label="Login" />
                    )}
                </Box>
                {loginError && (
                    <Typography variant="body2" color="error" align="center" marginTop="1rem">
                        {loginError}
                    </Typography>
                )}
            </Box>
        </Container>
    );
};

export default LoginPage;