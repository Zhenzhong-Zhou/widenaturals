import { createTheme } from '@mui/material/styles';

const lightMode = createTheme({
    palette: {
        mode: 'light', // Specifies the light theme
        primary: {
            main: '#2e7d32', // Natural green color for primary actions
            contrastText: '#ffffff', // White text on primary elements
        },
        secondary: {
            main: '#dc004e', // Accent color for secondary actions
            contrastText: '#ffffff', // White text on secondary elements
        },
        background: {
            default: '#f5f5f5', // Light grey background for the app
            paper: '#ffffff', // White background for paper elements
        },
        text: {
            primary: '#333333', // Dark text for readability on light backgrounds
            secondary: '#666666', // Lighter text for less prominent elements
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif', // Default font family
        // Additional typography settings can be customized as needed
    },
    shape: {
        borderRadius: 8, // Rounded corners for buttons and cards
    },
    spacing: 8, // Default spacing unit
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

const darkMode = createTheme({
    palette: {
        mode: 'dark', // Specifies the dark theme
        primary: {
            main: '#66bb6a', // A lighter green for better visibility on dark backgrounds
            contrastText: '#ffffff', // White text on primary elements
        },
        secondary: {
            main: '#ff4081', // Brighter accent color for secondary actions
            contrastText: '#ffffff', // White text on secondary elements
        },
        background: {
            default: '#303030', // Dark background for the app
            paper: '#424242', // Slightly lighter dark background for paper elements
        },
        text: {
            primary: '#ffffff', // White text for readability on dark backgrounds
            secondary: '#bdbdbd', // Light grey text for less prominent elements
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif', // Default font family
        // Additional typography settings can be customized as needed
    },
    shape: {
        borderRadius: 8, // Rounded corners for buttons and cards
    },
    spacing: 8, // Default spacing unit
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
                    backgroundColor: '#66bb6a', // Green background for the app bar in dark mode
                    color: '#ffffff', // White text color for the app bar
                },
            },
        },
    },
});

export { lightMode, darkMode };