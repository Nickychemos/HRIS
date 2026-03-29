import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { useAuth } from "../contexts/AuthContext";

const INITIAL_FORM = {
  fullName: "",
  nationalId: "",
  jobTitle: "",
  department: "",
  startDate: "",
  status: "active",
};

export default function Employees() {
  const { currentUser, userRole } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, [currentUser, userRole]);

  async function fetchEmployees() {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      let q;
      if (userRole === "admin") {
        q = query(collection(db, "employees"));
      } else {
        q = query(
          collection(db, "employees"),
          where("employerId", "==", currentUser.uid)
        );
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployees(data);
    } catch (err) {
      setError("Failed to fetch employees: " + err.message);
    }
    setLoading(false);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        const docRef = doc(db, "employees", editingId);
        await updateDoc(docRef, {
          fullName: form.fullName,
          nationalId: form.nationalId,
          jobTitle: form.jobTitle,
          department: form.department,
          startDate: form.startDate,
          status: form.status,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "employees"), {
          ...form,
          employerId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setForm(INITIAL_FORM);
      setEditingId(null);
      await fetchEmployees();
    } catch (err) {
      setError(editingId ? "Failed to update employee." : "Failed to create employee.");
    }
  }

  function handleEdit(employee) {
    setEditingId(employee.id);
    setForm({
      fullName: employee.fullName,
      nationalId: employee.nationalId,
      jobTitle: employee.jobTitle,
      department: employee.department,
      startDate: employee.startDate,
      status: employee.status,
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(INITIAL_FORM);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    setError("");
    try {
      await deleteDoc(doc(db, "employees", id));
      await fetchEmployees();
    } catch (err) {
      setError("Failed to delete employee.");
    }
  }

  return (
    <div className="page-container">
      <h1>Employee Management</h1>
      {error && <div className="error-message">{error}</div>}

      {(userRole === "employer" || userRole === "admin") && (
        <form onSubmit={handleSubmit} className="employee-form">
          <h3>{editingId ? "Edit Employee" : "Add New Employee"}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="nationalId">National ID</label>
              <input
                id="nationalId"
                name="nationalId"
                value={form.nationalId}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                id="jobTitle"
                name="jobTitle"
                value={form.jobTitle}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? "Update Employee" : "Add Employee"}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="employee-list">
        <h3>Employee Records</h3>
        {loading ? (
          <p>Loading employees...</p>
        ) : employees.length === 0 ? (
          <p>No employees found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>National ID</th>
                <th>Job Title</th>
                <th>Department</th>
                <th>Start Date</th>
                <th>Status</th>
                {userRole === "employer" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.fullName}</td>
                  <td>{emp.nationalId}</td>
                  <td>{emp.jobTitle}</td>
                  <td>{emp.department}</td>
                  <td>{emp.startDate}</td>
                  <td>
                    <span className={`status-badge ${emp.status}`}>
                      {emp.status}
                    </span>
                  </td>
                  {(userRole === "employer" || userRole === "admin") && (
                    <td>
                      <button onClick={() => handleEdit(emp)} className="btn btn-sm">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="btn btn-sm btn-danger">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
