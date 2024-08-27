import {useDispatch} from "react-redux";
import {useNavigate} from "react-router-dom";
import {useSnackbar} from 'notistack';
import {createAdmin} from "../../redux/thunks/initAdminThunk";
import {EmployeeForm} from "../../components";

const AdminCreationPage = ({ element, allowWithoutLogin }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    
    // Define the fields to be used in the form
    const adminFields = [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone_number', label: 'Phone Number', type: 'text', required: true },
        { name: 'job_title', label: 'Job Title', type: 'text', required: true },
        { name: 'role_name', label: 'Role Name', type: 'text', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
    ];
    
    // Function to handle admin creation submission
    const handleAdminCreation = async (formData) => {
        try {
            await dispatch(createAdmin(formData)).unwrap();
            navigate('/login');
        } catch (error) {
            // Display error using snackbar
            enqueueSnackbar('An error occurred while creating the admin.', { variant: 'error' });
        }
    };
    
    return (
        <EmployeeForm title="Create Admin" onSubmit={handleAdminCreation} fields={adminFields} />
    );
};

export default AdminCreationPage;