const drawerContentStyles = (theme, drawerWidth) => ({
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(1, 2), // Adjust padding instead of height for dynamic adjustment
        justifyContent: 'space-between',
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: 'sticky', // Keep header at the top of the drawer
        top: 0, // Align to top of drawer
    },
    drawerStyles: {
        '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            zIndex: theme.zIndex.drawer,
            transition: theme.transitions.create(['width', 'background-color'], {
                duration: theme.transitions.duration.standard,
            }),
            boxShadow: theme.shadows[5],
            position: 'fixed',
            height: '100vh',
            top: 0,
            left: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            overflowX: 'hidden', // Prevent horizontal scroll
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
        marginLeft: theme.spacing(1),
    },
    menuTitle: {
        padding: theme.spacing(2),
        color: theme.palette.text.primary,
        fontWeight: 'bold',
    },
    listItem: {
        color: theme.palette.text.primary,
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    icon: {
        marginRight: theme.spacing(2),
    },
    listItemText: {
        marginLeft: theme.spacing(1),
    },
});

export default drawerContentStyles;