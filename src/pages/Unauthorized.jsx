import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <Link to="/" className="btn btn-primary">Go to Dashboard</Link>
      </div>
    </div>
  );
}
