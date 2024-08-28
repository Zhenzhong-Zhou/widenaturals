import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {EmployeeForm} from "../../components";

const EmployeeFormContainer = ({ fields, title, onSubmit }) => {
    const { enqueueSnackbar } = useSnackbar();
    
    // Initialize form data state
    const [formData, setFormData] = useState(
        fields.reduce((acc, field) => {
            acc[field.name] = field.name === 'phone_number' ? '(000)-000-0000' : '';
            return acc;
        }, { confirm_password: '' })
    );
    
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'phone_number') {
            let digits = value.replace(/\D/g, '');
            if (digits.length > 10) {
                digits = digits.slice(0, 10);
            }
            
            let formattedValue = digits;
            if (digits.length > 6) {
                formattedValue = `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
            } else if (digits.length > 3) {
                formattedValue = `(${digits.slice(0, 3)})-${digits.slice(3)}`;
            } else if (digits.length > 0) {
                formattedValue = `(${digits}`;
            }
            
            setFormData({
                ...formData,
                [name]: formattedValue,
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
        
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }
    };
    
    const validate = () => {
        let tempErrors = {};
        fields.forEach((field) => {
            if (field.required && !formData[field.name]) {
                tempErrors[field.name] = `${field.label} is required`;
            }
        });
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:;<>,.?~\-=\[\]\\|]).{18,64}$/;
        if (!passwordRegex.test(formData.password)) {
            tempErrors.password = 'Password must be 18-64 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.';
        }
        
        if (formData.password !== formData.confirm_password) {
            tempErrors.confirm_password = 'Passwords do not match';
        }
        
        const jobTitleRegex = /^[A-Z][a-z]*(\s[A-Z][a-z]*)*$/;
        if (!jobTitleRegex.test(formData.job_title)) {
            tempErrors.job_title = 'Job title must start with an uppercase letter and only contain letters, with each word starting with an uppercase letter.';
        }
        
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();  // Prevent the form from reloading the page
        if (validate()) {
            onSubmit(formData)
                .then(() => {
                    enqueueSnackbar('Form submitted successfully!', { variant: 'success' });
                    setFormData(fields.reduce((acc, field) => {
                        acc[field.name] = field.name === 'phone_number' ? '(000)-000-0000' : '';
                        return acc;
                    }, { confirm_password: '' }));
                    setErrors({});
                })
                .catch((error) => {
                    if (error.response && error.response.data && error.response.data.errors) {
                        setErrors(error.response.data.errors);
                    } else {
                        enqueueSnackbar('An unexpected error occurred.', { variant: 'error' });
                    }
                });
        }
    };
    
    return (
        <EmployeeForm
            title={title}
            formData={formData}
            errors={errors}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            setShowPassword={setShowPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            fields={fields}
        />
    );
};

export default EmployeeFormContainer;