const footerStyles = (theme, drawerWidth, isDrawerOpen) => ({
    footer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing(2),
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        width: isDrawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%', // Adjust width based on drawer state
        textAlign: 'center',
        position: 'fixed',
        bottom: 0,
        left: isDrawerOpen ? `${drawerWidth}px` : 0, // Align to the drawer's width
        transition: theme.transitions.create(['margin-left', 'background-color', 'width', 'left'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
        }),
        zIndex: theme.zIndex.drawer + 1,
        boxShadow: theme.shadows[3],
        borderTop: `1px solid ${theme.palette.divider}`,
    },
    text: {
        marginBottom: theme.spacing(0.5),
        fontSize: '0.875rem',
        color: isDrawerOpen ? theme.palette.text.primary : theme.palette.common.white, // Text color adjusts to background
    },
});

export default footerStyles;