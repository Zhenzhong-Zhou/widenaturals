import {Button} from '@mui/material';

const SubmitButton = ({ label }) => {
    return (
        <Button type="submit" variant="contained" color="primary" fullWidth>
            {label}
        </Button>
    );
};

export default SubmitButton;