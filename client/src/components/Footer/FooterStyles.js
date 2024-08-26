const footerStyles = (theme) => ({
    footer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing(2), // Using theme spacing
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        width: '100%',
        textAlign: 'center',
        position: 'fixed',  // Fixed position to stick at bottom
        bottom: 0,
        left: 0,
        transition: 'background-color 0.3s ease', // Smooth transition for background color
        zIndex: theme.zIndex.appBar - 1, // Ensures the footer is behind the app bar if necessary
    },
    text: {
        marginBottom: theme.spacing(0.5),
    },
});

export default footerStyles;