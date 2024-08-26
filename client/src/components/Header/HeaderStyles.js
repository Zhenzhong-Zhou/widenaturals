const headerStyles = (theme) => ({
    appBar: {
        position: 'fixed',
        width: '100%',
        zIndex: theme.zIndex.drawer - 1, // Ensure header is above the main content but below the drawer when opened
        backgroundColor: theme.palette.primary.main, // Set AppBar background color from theme
        color: theme.palette.primary.contrastText, // Set text/icon color from theme
        transition: theme.transitions.create(['width', 'margin'], { // Smooth transition for responsive design
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        flexGrow: 1,
    },
    logoImage: {
        height: '40px', // Adjust based on your logo's aspect ratio
        marginRight: '8px',
    },
    sidebarButton: {
        marginRight: '16px',
        display: 'block',
        color: 'inherit',
    },
    iconButton: {
        color: 'inherit',
        marginLeft: '16px',
    },
    switchBase: {
        marginLeft: 'auto',
    },
});

export default headerStyles;