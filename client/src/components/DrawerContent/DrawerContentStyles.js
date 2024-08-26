const drawerContentStyles = (theme, drawerWidth) => ({
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        height: 65,
        padding: theme.spacing(0, 2),
        justifyContent: 'space-between',
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        boxShadow: theme.shadows[2],
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    drawerStyles: {
        '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth, // Customize drawer width
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
    },
    backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
        zIndex: theme.zIndex.drawer - 1, // Ensure it's just below the drawer
    },
    iconButton: {
        paddingLeft: theme.spacing(1.5),
        marginRight: theme.spacing(1),
        color: theme.palette.primary.contrastText,
    },
    closeButton: {
        marginLeft: theme.spacing(1),
        boxShadow: theme.shadows[3],
        color: theme.palette.primary.contrastText,
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
    }
});

export default drawerContentStyles;