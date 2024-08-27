import { TextField } from '@mui/material';

const InputField = ({ name, label, type = 'text', value, onChange, required = false, fullWidth = true, sx }) => {
    return (
        <TextField
            name={name}
            label={label}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            fullWidth={fullWidth}
            sx={sx}
        />
    );
};

export default InputField;