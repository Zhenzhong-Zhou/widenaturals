const headerStyles = (theme, drawerWidth, isDrawerOpen) => ({
    appBar: {
        position: 'fixed',
        zIndex: theme.zIndex.appBar, // Ensure header is always on top of other elements
        width: `calc(100% - ${isDrawerOpen ? drawerWidth : 0}px)`,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: isDrawerOpen ? `${drawerWidth}px` : 0,
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '64px',
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        flexGrow: 1,
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