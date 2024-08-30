import {useCallback, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { retrieveEmployeeProfile } from "../../redux/thunks/employeeProfileThunk";
import { clearEmployeeProfileState } from "../../redux/slices/employeeProfileSlice";
import {
    selectProfileError,
    selectFormattedProfile,
    selectProfileIsLoading,
    selectProfileImagePath, selectProfileThumbnailPath
} from "../../redux/selectors/employeeProfileSelector";
import {selectAuthIsLoading} from "../../redux/selectors/authSelectors";
import {Header} from "../../components";
import {EmployeeProfilePage} from "../../pages";

const EmployeeProfileContainer = () => {
    const dispatch = useDispatch();
    const profile = useSelector(selectFormattedProfile);
    const profileImagePath = useSelector(selectProfileImagePath);
    const thumbnailPath = useSelector(selectProfileThumbnailPath);
    const isProfileLoading = useSelector(selectProfileIsLoading);
    const isAuthLoading = useSelector(selectAuthIsLoading);
    const error = useSelector(selectProfileError);
    
    const fetchProfile = useCallback(async () => {
        try {
            await dispatch(retrieveEmployeeProfile());
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchProfile().catch((err) => {
            console.error("Unexpected error during fetchProfile execution:", err);
        });

        // Clean up profile data on component unmount
        return () => {
            dispatch(clearEmployeeProfileState());
        };
    }, [dispatch, fetchProfile]);

    return (
        <div>
            {/* Pass down props to Header and EmployeeProfilePage */}
            <Header profile={profile} profileImagePath={profileImagePath} thumbnailPath={thumbnailPath} isLoading={isAuthLoading} error={error} />
            <EmployeeProfilePage profile={profile} profileImagePath={profileImagePath} thumbnailPath={thumbnailPath} isLoading={isProfileLoading} error={error} />
        </div>
    );
};

export default EmployeeProfileContainer;