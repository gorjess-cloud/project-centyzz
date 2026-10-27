import UserManagementWorkspace from '../../components/users/UserManagementWorkspace.jsx';

// Superadmin-specific page and API route. No Admin page/controller is invoked.
export default function SuperadminUserManagementView({ currentUser, showHeaderActions = true }) {
  return <UserManagementWorkspace
    currentUser={currentUser}
    showHeaderActions={showHeaderActions}
    apiBase="/api/superadmin/users"
    visibleRoles={['SUPERADMIN', 'ADMIN', 'STAFF']}
  />;
}
