const loginPageStyles = (theme) => ({
    container: {
        marginTop: theme.spacing(8),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh', // Makes the container full height
        backgroundColor: theme.palette.background.default, // Subtle background color
    },
    paper: {
        padding: theme.spacing(4),
        borderRadius: theme.spacing(2), // Rounded corners for a modern look
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
    },
    companyName: {
        fontWeight: 'bold',
        marginBottom: theme.spacing(2),
    },
    title: {
        marginBottom: theme.spacing(3),
        fontSize: '1.75rem', // Slightly larger font size for modern typography
        fontWeight: 500,
    },
    form: {
        width: '100%',
        marginTop: theme.spacing(1),
    },
    submitButton: {
        marginTop: theme.spacing(3),
        padding: theme.spacing(1.5), // Larger padding for a bigger button
        fontSize: '1rem',
        fontWeight: 'bold',
        backgroundColor: theme.palette.primary.main,
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
        borderRadius: theme.shape.borderRadius * 2, // Rounded corners for button
        boxShadow: theme.shadows[2], // Adds a slight shadow for depth
    },
    errorText: {
        marginTop: theme.spacing(2),
    },
});

export default loginPageStyles;