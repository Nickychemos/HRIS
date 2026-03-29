import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (!currentUser) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">HRIS Platform</Link>
      </div>
      <div className="navbar-links">
        {userRole === "employer" && (
          <>
            <Link to="/employees">Employees</Link>
            <Link to="/documents">Documents</Link>
          </>
        )}
        {userRole === "admin" && (
          <>
            <Link to="/admin">Admin Dashboard</Link>
            <Link to="/employees">Employees</Link>
            <Link to="/documents">Documents</Link>
          </>
        )}
      </div>
      <div className="navbar-user">
        <span>{currentUser.email} ({userRole})</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
