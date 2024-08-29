const loginPageStyles = (theme) => ({
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(2),
    },
    paper: {
        padding: theme.spacing(4),
        borderRadius: theme.spacing(2),
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: theme.shadows[3],
        position: 'relative',
    },
    companyName: {
        fontWeight: 'bold',
        marginBottom: theme.spacing(2),
    },
    title: {
        marginBottom: theme.spacing(3),
        fontSize: '1.75rem',
        fontWeight: 500,
    },
    form: {
        width: '100%',
        marginTop: theme.spacing(1),
        position: 'relative',
    },
    submitButton: {
        marginTop: theme.spacing(3),
        padding: theme.spacing(1.5),
        fontSize: '1rem',
        fontWeight: 'bold',
        backgroundColor: theme.palette.primary.main,
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
        borderRadius: theme.shape.borderRadius * 2,
        boxShadow: theme.shadows[2],
    },
    errorText: {
        marginTop: theme.spacing(2),
    },
});

export default loginPageStyles;