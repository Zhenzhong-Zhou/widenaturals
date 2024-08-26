import { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    
    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught an error', error, info);
    }
    
    handleReload = () => {
        window.location.reload(); // Reload the page
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        backgroundColor: 'background.default',
                        color: 'text.primary',
                        textAlign: 'center',
                        padding: 3
                    }}
                >
                    <Typography variant="h4" gutterBottom>
                        Oops! Something went wrong.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        An unexpected error occurred. Please try reloading the page or go back to the homepage.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.handleReload}
                        sx={{ marginTop: 2 }}
                    >
                        Reload Page
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        component={RouterLink}
                        to="/"
                        sx={{ marginTop: 2 }}
                    >
                        Go to Homepage
                    </Button>
                </Box>
            );
        }
        
        return this.props.children;
    }
}

export default ErrorBoundary;