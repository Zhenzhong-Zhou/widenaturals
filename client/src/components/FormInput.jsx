import TextField from '@mui/material/TextField';

const FormInput = ({ label, type, value, onChange }) => {
    return (
        <TextField
            label={label}
            type={type}
            fullWidth
            margin="normal"
            variant="outlined"
            value={value}
            onChange={onChange}
        />
    );
};

export default FormInput;