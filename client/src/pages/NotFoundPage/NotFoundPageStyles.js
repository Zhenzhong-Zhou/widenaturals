const notFoundPageStyles = (theme) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        padding: theme.spacing(3),
    },
    heading: {
        marginBottom: theme.spacing(2),
    },
    button: {
        marginTop: theme.spacing(2),
    },
});

export default notFoundPageStyles;