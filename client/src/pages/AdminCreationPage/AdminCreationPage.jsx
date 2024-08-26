const AdminCreationPage = ({ element, allowWithoutLogin }) => {
    return (
        <div>
            <h1>Admin Creation Page</h1>
            {allowWithoutLogin ? (
                <p>This page can be accessed without login.</p>
            ) : (
                <p>Authentication is required to access this page.</p>
            )}
        </div>
    );
};

export default AdminCreationPage;