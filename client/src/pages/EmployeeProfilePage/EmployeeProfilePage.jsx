import {LoadingSpinner} from "../../components";

const EmployeeProfilePage = ({profile, profileImagePath, isLoading, error}) => {
    if (isLoading) {
        return <LoadingSpinner message={"Loading Profile..."} />;
    }
    
    if (error) {
        return <div><p>{JSON.stringify(error)}</p></div>;
    }
    
    return (
        <div>
            <h1>Profile</h1>
            {/* Check if the profileImage and imagePath exist before rendering the image */}
            {profileImagePath ? (
                <img
                    src={profileImagePath}  // Render the image using the path
                    alt={profile.fullName}  // Provide alternative text for accessibility
                    style={{maxWidth: '100%', height: 'auto'}}  // Optional styles for responsive images
                />
            ) : (
                <p>No profile image available.</p>  // Fallback text if no image path is present
            )}
            <p>Full Name: {profile.fullName}</p>
            <p>Email: {profile.email}</p>
            <p>Phone Number: {profile.phoneNumber}</p>
            <p>Job Title: {profile.jobTitle}</p>
            <p>Role: {profile.roleName}</p>
            <p>Created At: {profile.createdAt}</p>
            <p>Updated At: {profile.updatedAt}</p>
            <p>Last Login: {profile.lastLogin}</p>
        </div>
    );
};

export default EmployeeProfilePage;