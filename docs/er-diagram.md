# HRIS Platform — Entity-Relationship Diagram (Mermaid Source)

```mermaid
erDiagram
    EMPLOYERS {
        string id PK "Firebase Auth UID"
        string companyName
        string email
        timestamp createdAt "server-set, immutable on update"
    }

    EMPLOYEES {
        string id PK "auto-generated"
        string fullName
        string nationalId
        string jobTitle
        string department
        string startDate
        string status "active | inactive"
        string employerId FK "employer Auth UID — used in Security Rules"
        timestamp createdAt "server-set, immutable on update"
        timestamp updatedAt "server-set"
    }

    DOCUMENTS {
        string id PK "auto-generated"
        string employeeId FK "employee document ID"
        string uploadedBy FK "employer Auth UID — used in Security Rules"
        timestamp uploadedAt "server-set, immutable on update"
        string storagePath "path segment in Storage Security Rules"
        string fileName
        number fileSize
    }

    EMPLOYERS ||--o{ EMPLOYEES : "owns (employerId = Auth UID)"
    EMPLOYEES ||--o{ DOCUMENTS : "has (employeeId = document ID)"
    EMPLOYERS ||--o{ DOCUMENTS : "uploads (uploadedBy = Auth UID)"
```

## Field Usage in Security Rules

| Field        | Collection  | Security Rule Purpose                                    |
|--------------|-------------|----------------------------------------------------------|
| `employerId` | employees   | Employer can only read/write own employees               |
| `uploadedBy` | documents   | Employer can only read/write own documents               |
| `createdAt`  | employees   | Cannot be overwritten on update (audit integrity)        |
| `uploadedAt` | documents   | Cannot be overwritten on update (audit integrity)        |
| `storagePath`| documents   | Contains `{employerId}` matching Storage Rules path      |

## Server-Set vs Client-Provided Fields

| Field        | Set By   | Validation                                               |
|--------------|----------|----------------------------------------------------------|
| `createdAt`  | Server   | `serverTimestamp()` — Security Rules verify `is timestamp`|
| `updatedAt`  | Server   | `serverTimestamp()` — updated on every write              |
| `uploadedAt` | Server   | `serverTimestamp()` — Security Rules verify `is timestamp`|
| `employerId` | Client   | Security Rules verify matches `request.auth.uid`         |
| `uploadedBy` | Client   | Security Rules verify matches `request.auth.uid`         |
| All others   | Client   | User-provided data                                       |
