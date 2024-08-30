const layoutStyles = (theme, isDrawerOpen, drawerWidth) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default, // Ensure background color consistency
    },
    mainContent: {
        flexGrow: 1,
        padding: theme.spacing(10), // Add padding for spacing
        transition: theme.transitions.create(['margin-left', 'padding-top'], {
            duration: theme.transitions.duration.standard,
        }),
        marginLeft: {
            xs: 0,
            sm: isDrawerOpen ? `${drawerWidth}px` : 0,
        },
        backgroundColor: theme.palette.background.paper, // Background color for main content
        paddingTop: `calc(${theme.spacing(5)} + 64px)`,
        // width: `calc(100% - ${isDrawerOpen ? drawerWidth : 0}px)`,
        [theme.breakpoints.down('sm')]: {
            marginLeft: 0, // Reset margin for smaller screens
            width: '100%', // Full width on smaller screens
        },
    },
});

export default layoutStyles;