import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2e7d32', // Green color reflecting natural supplement theme
            contrastText: '#ffffff', // White text for contrast
        },
        secondary: {
            main: '#dc004e', // Accent color, can be adjusted as needed
            contrastText: '#ffffff', // White text for contrast
        },
        background: {
            default: '#f5f5f5', // Light gray background for app
            paper: '#ffffff', // White background for paper components
        },
        text: {
            primary: '#333333', // Dark text for readability
            secondary: '#666666', // Lighter text for secondary content
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif', // Primary font family
        h1: {
            fontSize: '2rem', // Heading 1
            fontWeight: 500, // Medium weight
        },
        h2: {
            fontSize: '1.75rem', // Heading 2
            fontWeight: 500,
        },
        h3: {
            fontSize: '1.5rem', // Heading 3
            fontWeight: 500,
        },
        h4: {
            fontSize: '1.25rem', // Heading 4
            fontWeight: 500,
        },
        h5: {
            fontSize: '1rem', // Heading 5
            fontWeight: 500,
        },
        h6: {
            fontSize: '0.875rem', // Heading 6
            fontWeight: 500,
        },
        body1: {
            fontSize: '1rem', // Standard text
            fontWeight: 400, // Regular weight
        },
        body2: {
            fontSize: '0.875rem', // Smaller text
            fontWeight: 400,
        },
        button: {
            textTransform: 'none', // No uppercase transform for buttons
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 8, // Rounded corners for buttons and other components
    },
    spacing: 8, // Default spacing unit (8px)
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px', // Rounded buttons
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                colorPrimary: {
                    backgroundColor: '#2e7d32', // Green background for the app bar
                    color: '#ffffff', // White text color for the app bar
                },
            },
        },
    },
});

export default theme;