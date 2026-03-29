import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, isFirebaseConfigured } from "../utils/firebase";
import { useAuth } from "../contexts/AuthContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function Documents() {
  const { currentUser, userRole } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDocuments();
    fetchEmployees();
  }, [currentUser, userRole]);

  async function fetchEmployees() {
    if (!isFirebaseConfigured || !db) return;
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
      setEmployees(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  }

  async function fetchDocuments() {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let q;
      if (userRole === "admin") {
        q = query(collection(db, "documents"));
      } else {
        q = query(
          collection(db, "documents"),
          where("uploadedBy", "==", currentUser.uid)
        );
      }
      const snapshot = await getDocs(q);
      setDocuments(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (err) {
      setError("Failed to fetch documents.");
    }
    setLoading(false);
  }

  function handleFileChange(e) {
    const selected = e.target.files[0];
    setError("");

    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      setFile(null);
      e.target.value = "";
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("File size must be under 10MB.");
      setFile(null);
      e.target.value = "";
      return;
    }

    setFile(selected);
  }

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedEmployee || !file) {
      setError("Please select an employee and a PDF file.");
      return;
    }

    setUploading(true);

    try {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const storagePath = `Documents/${currentUser.uid}/${selectedEmployee}/${yearMonth}/${file.name}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file, {
        contentType: "application/pdf",
      });

      await addDoc(collection(db, "documents"), {
        employeeId: selectedEmployee,
        uploadedBy: currentUser.uid,
        uploadedAt: serverTimestamp(),
        storagePath: storagePath,
        fileName: file.name,
        fileSize: file.size,
      });

      setSuccess(`"${file.name}" uploaded successfully.`);
      setFile(null);
      setSelectedEmployee("");
      const fileInput = document.getElementById("file-input");
      if (fileInput) fileInput.value = "";
      await fetchDocuments();
    } catch (err) {
      setError("Failed to upload document: " + err.message);
    }

    setUploading(false);
  }

  async function handleDownload(docItem) {
    try {
      const storageRef = ref(storage, docItem.storagePath);
      const url = await getDownloadURL(storageRef);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Download error:", err.code, err.message);
      setError("Failed to download document: " + (err.code || err.message));
    }
  }

  function getEmployeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.fullName : employeeId;
  }

  return (
    <div className="page-container">
      <h1>Document Management</h1>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {(userRole === "employer" || userRole === "admin") && (
        <form onSubmit={handleUpload} className="upload-form">
          <h3>Upload Document</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="employee-select">Employee</label>
              <select
                id="employee-select"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                required
              >
                <option value="">Select an employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="file-input">PDF Document (max 10MB)</label>
              <input
                id="file-input"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={uploading} className="btn btn-primary">
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      )}

      <div className="document-list">
        <h3>Uploaded Documents</h3>
        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p>No documents found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Employee</th>
                <th>Uploaded At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.fileName}</td>
                  <td>{getEmployeeName(doc.employeeId)}</td>
                  <td>
                    {doc.uploadedAt?.toDate
                      ? doc.uploadedAt.toDate().toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="btn btn-sm"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
