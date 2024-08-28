const inputFieldStyles = (theme) => ({
    inputField: {
        // Add your custom styles here
        marginBottom: theme.spacing(2),
        '& .MuiInputBase-root': {
            backgroundColor: theme.palette.background.paper,
        },
        '& .MuiFormLabel-root': {
            color: theme.palette.text.primary,
        },
        '& .Mui-focused': {
            color: theme.palette.primary.main,
        },
        '& .Mui-error': {
            color: theme.palette.error.main,
        },
        '& .MuiInput-underline:before': {
            borderBottomColor: theme.palette.divider,
        },
        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
            borderBottomColor: theme.palette.primary.light,
        },
        '& .MuiInput-underline:after': {
            borderBottomColor: theme.palette.primary.main,
        },
    },
    adornmentIcon: {
        color: theme.palette.text.secondary,
    },
});

export default inputFieldStyles;