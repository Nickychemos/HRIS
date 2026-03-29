import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "../contexts/AuthContext";

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employer");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleCreateUser(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const functions = getFunctions();
      const createUserWithRole = httpsCallable(functions, "createUserWithRole");
      const result = await createUserWithRole({
        email,
        password,
        role,
        displayName,
      });
      setMessage(result.data.message);
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (err) {
      const msg = err.details?.message || err.message || "Failed to create user.";
      setError(msg);
    }

    setLoading(false);
  }

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      <p>Logged in as: <strong>{currentUser?.email}</strong></p>

      <div className="admin-section">
        <h3>Create New User</h3>
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleCreateUser} className="employee-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-displayName">Display Name</label>
              <input
                id="admin-displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-role">Role</label>
              <select
                id="admin-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="employer">Employer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}
