const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const sgMail = require("@sendgrid/mail");

initializeApp();
setGlobalOptions({ region: "us-central1" });

exports.setUserRole = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can assign roles.");
  }

  const { uid, role } = request.data;

  if (!uid || !role) {
    throw new HttpsError("invalid-argument", "uid and role are required.");
  }

  const validRoles = ["employer", "admin"];
  if (!validRoles.includes(role)) {
    throw new HttpsError("invalid-argument", `Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  await getAuth().setCustomUserClaims(uid, { role });
  return { message: `Role '${role}' set for user ${uid}` };
});

exports.createUserWithRole = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can create users with roles.");
  }

  const { email, password, role, displayName } = request.data;

  if (!email || !password || !role) {
    throw new HttpsError("invalid-argument", "email, password, and role are required.");
  }

  const validRoles = ["employer", "admin"];
  if (!validRoles.includes(role)) {
    throw new HttpsError("invalid-argument", `Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  const userRecord = await getAuth().createUser({
    email,
    password,
    displayName: displayName || email,
  });

  await getAuth().setCustomUserClaims(userRecord.uid, { role });

  return {
    uid: userRecord.uid,
    message: `User created with role '${role}'`,
  };
});

exports.onDocumentUpload = onDocumentCreated("documents/{documentId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const documentData = snapshot.data();
  const { employeeId, fileName, uploadedBy } = documentData;

  let employeeName = "Unknown Employee";
  try {
    const db = getFirestore();
    const employeeDoc = await db.collection("employees").doc(employeeId).get();
    if (employeeDoc.exists) {
      employeeName = employeeDoc.data().fullName || employeeName;
    }
  } catch (error) {
    console.error("Error fetching employee record:", error);
  }

  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@hris-platform.com";

  if (!sendgridApiKey) {
    console.error("SENDGRID_API_KEY not configured. Skipping email notification.");
    return;
  }

  if (!notificationEmail) {
    console.error("NOTIFICATION_EMAIL not configured. Skipping email notification.");
    return;
  }

  sgMail.setApiKey(sendgridApiKey);

  const msg = {
    to: notificationEmail,
    from: fromEmail,
    subject: `New Document Uploaded for ${employeeName}`,
    text: `A new document has been uploaded for ${employeeName}.\n\nFile: ${fileName}\nUploaded by: ${uploadedBy}\n\nPlease log in to the HRIS platform to view the document.`,
    html: `
      <h2>New Document Uploaded</h2>
      <p>A new document has been uploaded for <strong>${employeeName}</strong>.</p>
      <ul>
        <li><strong>File:</strong> ${fileName}</li>
        <li><strong>Uploaded by:</strong> ${uploadedBy}</li>
      </ul>
      <p>Please log in to the HRIS platform to view the document.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Notification email sent for document: ${fileName}`);
  } catch (error) {
    console.error("Error sending email notification:", error);
    if (error.response) {
      console.error("SendGrid response error:", error.response.body);
    }
  }
});
