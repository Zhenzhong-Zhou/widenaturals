const footerStyles = (theme, isModeChanged) => ({
    footer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing(2), // Using theme spacing
        backgroundColor: isModeChanged ? theme.palette.secondary.main : theme.palette.primary.main,
        color: theme.palette.common.white,
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        bottom: 0,
        left: 0,
        transition: 'background-color 0.3s ease', // Smooth transition for background color
    },
    text: {
        marginBottom: theme.spacing(0.5),
    },
});

export default footerStyles;