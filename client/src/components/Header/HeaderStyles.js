const headerStyles = (theme) => ({
    appBar: {
        position: 'fixed',
        width: '100%',
        zIndex: theme.zIndex.drawer + 1, // Ensures the header is above the drawer but below modals
        backgroundColor: theme.palette.primary.main, // Sets AppBar background color from theme
        color: theme.palette.primary.contrastText, // Sets text/icon color from theme
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