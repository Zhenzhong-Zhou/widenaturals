import { createTheme } from '@mui/material/styles';

const lightMode = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2e7d32',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#dc004e',
            contrastText: '#ffffff',
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
        text: {
            primary: '#333333',
            secondary: '#666666',
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        // Additional typography settings
    },
    shape: {
        borderRadius: 8,
    },
    spacing: 8,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                colorPrimary: {
                    backgroundColor: '#2e7d32',
                    color: '#ffffff',
                },
            },
        },
    },
});

const darkMode = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#66bb6a',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#ff4081',
            contrastText: '#ffffff',
        },
        background: {
            default: '#303030',
            paper: '#424242',
        },
        text: {
            primary: '#ffffff',
            secondary: '#bdbdbd',
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        // Additional typography settings
    },
    shape: {
        borderRadius: 8,
    },
    spacing: 8,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                colorPrimary: {
                    backgroundColor: '#66bb6a',
                    color: '#ffffff',
                },
            },
        },
    },
});

export { lightMode, darkMode };