const employeeFormStyles = (theme) => ({
    paper: {
        padding: theme.spacing(3),
        marginTop: theme.spacing(4),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    input: {
        marginBottom: theme.spacing(2),
    },
    submitButton: {
        marginTop: theme.spacing(2),
    },
});

export default employeeFormStyles;