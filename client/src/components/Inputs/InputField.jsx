import { TextField } from '@mui/material';

const InputField = ({name, label, type = 'text', value, onChange, required = false, fullWidth = true, error = false, helperText = '', sx}) => {
    return (
        <TextField
            name={name}
            label={label}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            fullWidth={fullWidth}
            error={error} // Add error prop
            helperText={helperText} // Add helperText prop
            sx={sx}
        />
    );
};

export default InputField;