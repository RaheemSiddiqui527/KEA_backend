# KEA Portal Backend API

This repository houses the core RESTful API server for the **Kokani Engineers & Professionals Association (KEA)** platform. It manages authentication, membership databases, job postings, mentorship matching, community forums, knowledge hubs, and system backups.

## Tech Stack
* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Database**: MongoDB (via Mongoose ODM)
* **Authentication**: JSON Web Token (JWT) & bcryptjs hashing
* **File Uploads**: Multer local disk storage validation
* **Email dispatch**: Resend API Integration

---

## Architecture & Features

### 1. Role-Based Access Control (RBAC)
Supports hierarchical roles with specialized access rules:
* `user`: Standard association member (requires email verification and admin approval).
* `admin`: Panel moderator with capabilities to approve content, members, events, and reviews.
* `superadmin`: Root level access with exclusive rights to manage admin accounts (CRUD) and configure system settings.

### 2. Automated ID Assignment
Maintains a sequential unique ID schema inside the pre-save database trigger:
* Normal Users: `KEA-001`, `KEA-002`, etc.
* Admins: `KEA-ADM-001`, `KEA-ADM-002`, etc. (prevents index clashing).

### 3. Multer Avatar Middleware
Ensures uploaded avatars match strict security criteria:
* Formats allowed: `.jpg`, `.jpeg`, `.png`
* File size limit: `5MB`
* Mapped directly to route `PATCH /api/users/me/avatar`

---

## Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=7101
MONGO_URI=mongodb://localhost:27017/kea
JWT_SECRET=your_jwt_secret_key_here

# SMTP configuration for notifications
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM_EMAIL=no-reply@kea.com
```

### 3. Running the Server
Start the development server with nodemon (hot reloading):
```bash
npm run dev
```

The API will be available at: `http://localhost:7101`

---

## Key Routes Overview

* **Authentication**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/admin/login`
* **User Management**: `PATCH /api/users/me/avatar`, `GET /api/users/profile`
* **Admin Controls**: `GET /api/admin/admins`, `POST /api/admin/admins`, `PATCH /api/admin/admins/:id`, `DELETE /api/admin/admins/:id`
* **System Operations**: `POST /api/admin/backup`, `POST /api/admin/restore`, `POST /api/admin/test-email`
