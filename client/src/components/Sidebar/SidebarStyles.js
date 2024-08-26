import { styled } from '@mui/material/styles';

// DrawerHeader styled component with company logo, name, and close button
export const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    height: 65,
    padding: theme.spacing(0, 2),
    justifyContent: 'space-between',
    zIndex: theme.zIndex.drawer + 1, // Ensure the header is above drawer content
    backgroundColor: theme.palette.primary.main, // Background color from theme
    color: theme.palette.primary.contrastText, // Text color from theme
    boxShadow: theme.shadows[2], // Add subtle shadow to header
}));

// Function to return styles for the sidebar
export const sidebarStyles = (theme) => ({
    '& .MuiDrawer-paper': {
        boxSizing: 'border-box',
        width: 250, // Customize drawer width
        backgroundColor: theme.palette.background.default, // Dynamic based on theme
        color: theme.palette.text.primary, // Text color based on theme
        zIndex: theme.zIndex.drawer + 1, // Ensures the drawer overlays the AppBar
        transition: theme.transitions.create(['width', 'background-color'], {
            duration: theme.transitions.duration.standard,
        }), // Smooth transition for width and background color changes
        boxShadow: theme.shadows[5], // Subtle shadow for drawer
        position: 'fixed', // Ensures the drawer overlays the header
        height: '100vh', // Full height for the drawer
        top: 0, // Position from the top of the viewport
        left: 0, // Position from the left of the viewport
        borderRight: `1px solid ${theme.palette.divider}`, // Add border to distinguish from the main content
    },
});