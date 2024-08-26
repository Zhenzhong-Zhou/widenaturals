import { Link as RouterLink } from 'react-router-dom';
import {Box} from '@mui/material';

const Logo = () => {
    return (
       <RouterLink to='/'>
           <Box
               component="img"
               src="/logo.png" // Replace with the path to your logo image
               alt="Company Logo"
               sx={{
                   height: '35px',
                   marginRight: '8px',
                   transition: 'transform 0.3s ease-in-out',
                   '&:hover': {
                       transform: 'scale(1.1)',
                   },
               }}
           />
       </RouterLink>
    );
};

export default Logo;