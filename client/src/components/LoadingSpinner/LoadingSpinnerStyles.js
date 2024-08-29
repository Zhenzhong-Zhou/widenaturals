const loadingSpinnerStyles = (theme) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: theme.palette.background.default, // Using theme background color
        padding: theme.spacing(2), // Adding padding for spacing from the edges
        textAlign: 'center', // Center text alignment
    },
    spinner: {
        color: theme.palette.primary.main,
        marginBottom: theme.spacing(2),
    },
    text: {
        marginTop: theme.spacing(2),
        color: theme.palette.text.primary,
        fontWeight: 'bold',
    },
});

export default loadingSpinnerStyles;