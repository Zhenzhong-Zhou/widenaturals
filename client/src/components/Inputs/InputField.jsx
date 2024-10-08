import { useState } from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import inputFieldStyles from './InputFieldStyles';

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
                        validateEmail = true,
                        customValidation,
                        autoComplete, // Add this prop
                    }) => {
    const [showPassword, setShowPassword] = useState(false);
    
    const theme = useTheme();
    const styles = inputFieldStyles(theme);
    
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
        if (validateEmail) {
            // Perform validation only if validateEmail is true
            if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailValue)) {
                // Optionally set error state here if needed
            }
        }
        // Call onChange regardless to update the state in parent component
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
            value={value}
            onChange={handleChange}
            required={required}
            fullWidth={fullWidth}
            sx={{ ...styles.inputField, ...sx }}
            error={error}
            helperText={helperText}
            autoComplete={autoComplete || 'off'}
            slotProps={{
                input: {
                    endAdornment: type === 'password' && (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={handleClickShowPassword}
                                edge="end"
                                aria-label="toggle password visibility"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
};

export default InputField;