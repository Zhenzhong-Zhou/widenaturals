import { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const InputField = ({
                        name,
                        label,
                        type = 'text',
                        value,
                        onChange,
                        required = false,
                        fullWidth = true,
                        sx,
                        error,
                        helperText,
                        validateEmail = true, // Optional prop to toggle email validation
                        customValidation // Optional prop for custom validation
                    }) => {
    const [showPassword, setShowPassword] = useState(false);
    
    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };
    
    const formatPhoneNumber = (phoneNumber) => {
        const cleaned = ('' + phoneNumber).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[1]})-${match[2]}-${match[3]}`;
        }
        return phoneNumber;
    };
    
    const handlePhoneNumberChange = (event) => {
        const formattedPhoneNumber = formatPhoneNumber(event.target.value);
        onChange({ ...event, target: { ...event.target, value: formattedPhoneNumber } });
    };
    
    const handleEmailChange = (event) => {
        const emailValue = event.target.value;
        if (validateEmail && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailValue)) {
            onChange({ ...event, target: { ...event.target, value: emailValue } });
            return;
        }
        onChange(event);
    };
    
    const handleChange = (event) => {
        if (customValidation) {
            customValidation(event);
        } else if (type === 'tel') {
            handlePhoneNumberChange(event);
        } else if (type === 'email') {
            handleEmailChange(event);
        } else {
            onChange(event);
        }
    };
    
    return (
        <TextField
            name={name}
            label={label}
            type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
            value={type === 'tel' ? formatPhoneNumber(value) : value}
            onChange={handleChange}
            required={required}
            fullWidth={fullWidth}
            sx={sx}
            error={error}
            helperText={helperText}
            InputProps={
                type === 'password'
                    ? {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={handleClickShowPassword}
                                    edge="end"
                                    aria-label="toggle password visibility"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }
                    : null
            }
        />
    );
};

export default InputField;