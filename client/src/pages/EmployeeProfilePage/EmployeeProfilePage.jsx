import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {retrieveEmployeeProfile} from "../../redux/thunks/employeeProfileThunk";
import {clearEmployeeProfileState} from "../../redux/slices/employeeProfileSlice";
import {selectError, selectFormattedProfile, selectIsLoading} from "../../redux/selectors/employeeProfileSelector";

const EmployeeProfilePage = () => {
    const dispatch = useDispatch();
    const profile = useSelector(selectFormattedProfile);
    const isLoading = useSelector(selectIsLoading);
    const error = useSelector(selectError);
    
    console.log(profile.fullName);
    
    useEffect(() => {
        dispatch(retrieveEmployeeProfile());
        
        // Clean up profile data on component unmount
        return () => {
            dispatch(clearEmployeeProfileState());
        };
    }, [dispatch]);
    
    return (
        <div>
            <h1>Profile</h1>
            {/* Render other profile data here */}
        </div>
    );
};

export default EmployeeProfilePage;