const sidebarStyles = (theme) => ({
    backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
        zIndex: theme.zIndex.drawer - 1, // Ensure it's just below the drawer
    },
    closeButton: {
        boxShadow: theme.shadows[3],
        color: theme.palette.primary.contrastText,
    },
});

export default sidebarStyles;