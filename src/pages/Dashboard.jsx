import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { currentUser, userRole } = useAuth();

  return (
    <div className="page-container">
      <h1>Dashboard</h1>
      <div className="dashboard-welcome">
        <p>Welcome, <strong>{currentUser?.displayName || currentUser?.email}</strong></p>
        <p>Role: <strong>{userRole}</strong></p>
      </div>

      {userRole === "employer" && (
        <div className="dashboard-cards">
          <div className="card">
            <h3>Employees</h3>
            <p>Manage your employee records — create, view, update, and remove employees.</p>
          </div>
          <div className="card">
            <h3>Documents</h3>
            <p>Upload and manage PDF documents for your employees.</p>
          </div>
        </div>
      )}

      {userRole === "admin" && (
        <div className="dashboard-cards">
          <div className="card">
            <h3>Admin Panel</h3>
            <p>Manage employers, assign roles, and oversee the platform.</p>
          </div>
          <div className="card">
            <h3>All Employees</h3>
            <p>View employee records across all employers.</p>
          </div>
          <div className="card">
            <h3>All Documents</h3>
            <p>Access uploaded documents across the platform.</p>
          </div>
        </div>
      )}
    </div>
  );
}
