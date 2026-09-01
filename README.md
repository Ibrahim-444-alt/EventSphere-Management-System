# EventSphere Management System

A full-stack event & expo management platform with three dedicated portals — **Admin**, **Exhibitor**, and **Attendee** — built on the MERN stack (MongoDB, Express, React, Node.js).

EventSphere lets an organizer run an entire expo lifecycle from one system: publish events, open exhibitor applications, assign show-floor booths, build a speaker schedule, run registration and check-in at the door, and collect feedback — while exhibitors and attendees each get a focused portal for their own side of it.

> 📄 Looking for endpoint-level detail or data model documentation? See [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)

  * [Prerequisites](#prerequisites)
  * [1. Clone & Install](#1-clone--install)
  * [2. Configure Environment Variables](#2-configure-environment-variables)
  * [3. Run the App](#3-run-the-app)
  * [4. Seed Demo Users](#4-seed-demo-users)
  * [5. Login](#5-login)
* [Available Scripts](#available-scripts)
* [Roles & Access](#roles--access)
* [Theming](#theming)
* [Maintenance Scripts](#maintenance-scripts)
* [Known Limitations](#known-limitations)
* [License](#license)

---

## Features

### 🌐 Public Site

* Home page with live, real-time stats (events, exhibitors, attendees, venues)
* Event listing & detail pages, with speakers and schedule
* Public speaker directory and session schedule
* Public, moderated attendee feedback wall with average rating
* Contact form
* Light / dark theme toggle, persisted per device

### 🛠️ Admin Portal

* **Expo management** — create, edit, publish (Draft → Upcoming → Ongoing → Completed/Cancelled), and delete events
* **Exhibitor management** — review applications, approve/reject, search & filter
* **Booth management + interactive floor plan** — create booths per event, assign/reassign/release exhibitors, live status (Available / Reserved / Occupied / Pending / Maintenance)
* **Speaker & schedule management** — manage speakers and sessions, with automatic **double-booking prevention**
* **Attendee management** — manual walk-in registration, search, check-in/undo, cancellation
* **Feedback moderation** — publish or hide submitted feedback
* **Inquiries** — respond to and triage contact-form submissions
* **Analytics dashboard** — registrations, exhibitor/booth breakdowns, ticket types, ratings, recent activity — scoped to one event or the whole organization
* **CSV reports** — one-click export for attendees, exhibitors, booths, sessions, and feedback
* **Settings** — organization contact information and global on/off switches for registrations and feedback collection

### 🏢 Exhibitor Portal

* Apply to exhibit at any open event
* Track application status (Pending / Approved / Rejected / Active / Inactive)
* Manage company profile (logo, description, category, products/services, staff)
* View assigned booth details once approved and assigned

### 🎟️ Attendee Portal

* Browse and register for events with registration-deadline enforcement
* View & cancel your own registrations
* Browse the session schedule and bookmark sessions to build a personal agenda
* Leave event/session feedback limited to events actually attended
* Manage personal profile

---

## Tech Stack

| Layer             | Technology                                           |
| ----------------- | ---------------------------------------------------- |
| Frontend          | React 19, React Router 7, Vite, Axios                |
| Backend           | Node.js, Express 4                                   |
| Database          | MongoDB with Mongoose 8                              |
| Authentication    | JWT (`jsonwebtoken`)                                 |
| Password Security | `bcryptjs`                                           |
| File Uploads      | Multer (local disk storage)                          |
| Email             | Nodemailer with SMTP / Ethereal development fallback |
| Styling           | CSS Custom Properties with light/dark theme support  |

---

## Project Structure

```text
eventsphere-management/

├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── components/             # Shared UI components
│   │   ├── context/                # AuthContext, ThemeContext
│   │   ├── hooks/                  # useAuth, useTheme
│   │   ├── layouts/                # MainLayout, AdminLayout,
│   │   │                            # ExhibitorLayout, AttendeeLayout
│   │   ├── pages/
│   │   │   ├── public/             # Public pages
│   │   │   ├── admin/              # Admin portal pages
│   │   │   ├── exhibitor/          # Exhibitor portal pages
│   │   │   └── attendee/           # Attendee portal pages
│   │   ├── routes/                 # AppRoutes.jsx
│   │   ├── services/               # API service files
│   │   ├── styles/                 # Global and responsive CSS
│   │   └── utils/                  # Shared utility functions
│   └── package.json
│
├── server/                         # Express + MongoDB backend
│   ├── config/                     # Database configuration
│   ├── controllers/                # Business logic
│   ├── middleware/                 # Authentication & authorization
│   ├── models/                     # Mongoose schemas
│   ├── routes/                     # Express API routes
│   ├── seed/
│   │   └── seedUsers.js            # Demo user seeding script
│   ├── utils/                      # JWT, email, CSV helpers
│   ├── uploads/                    # Local uploaded files
│   ├── fixBoothIndex.js            # One-time booth index maintenance
│   └── server.js                   # App entry point
│
├── docs/
│   ├── API_REFERENCE.md
│   └── ARCHITECTURE.md
│
└── README.md
```

---

## Getting Started

### Prerequisites

Before running EventSphere, make sure the following are installed:

* **Node.js 18 or later**
* **MongoDB**

  * MongoDB Community Server for local development, or
  * MongoDB Atlas for cloud hosting
* Git

An SMTP account is optional. The application automatically uses an Ethereal test inbox during development when SMTP credentials are not provided.

---

### 1. Clone & Install

Clone the repository and install dependencies for both the backend and frontend.

```bash
git clone <your-repo-url>

cd eventsphere-management

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

### 2. Configure Environment Variables

Create a `.env` file inside the `server/` directory.

```env
# server/.env

PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/eventsphere

# JWT
# Use a strong, unique secret in production.
JWT_SECRET=replace-this-with-a-long-random-string

# Email / SMTP
# Leave EMAIL_USER and EMAIL_PASSWORD blank during development
# to use the automatic Ethereal test-inbox fallback.

EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM="EventSphere <no-reply@eventsphere.local>"
```

### Environment Variables

| Variable         | Required | Description                                |
| ---------------- | -------- | ------------------------------------------ |
| `PORT`           | No       | Express server port. Defaults to `5000`.   |
| `MONGO_URI`      | **Yes**  | MongoDB connection string.                 |
| `JWT_SECRET`     | **Yes**  | Secret used to sign authentication tokens. |
| `EMAIL_USER`     | No       | SMTP username/email.                       |
| `EMAIL_PASSWORD` | No       | SMTP password or Gmail App Password.       |
| `EMAIL_HOST`     | No       | SMTP host. Defaults to Gmail SMTP.         |
| `EMAIL_PORT`     | No       | SMTP port. Defaults to `587`.              |
| `EMAIL_FROM`     | No       | Sender address used by the application.    |

> ⚠️ **Security:** Never commit `.env` files or real credentials to GitHub. Use strong secrets for production deployments.

### Optional Client Environment Variable

Create `client/.env` only if the backend is running somewhere other than the default address.

```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Run the App

Open **two separate terminals**.

#### Terminal 1 — Backend

```bash
cd server
npm run dev
```

The backend runs by default at:

```text
http://localhost:5000
```

#### Terminal 2 — Frontend

```bash
cd client
npm run dev
```

The frontend runs by default at:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

---

### 4. Seed Demo Users

EventSphere includes a seed script that creates ready-to-use demo accounts for all three roles.

Make sure MongoDB is running, then execute:

```bash
cd server
node seed/seedUsers.js
```

A successful run creates:

```text
admin@eventsphere.com
exhibitor@eventsphere.com
attendee@eventsphere.com
```

The seed script is safe to run during development. Existing users with the same email addresses are handled by the script rather than creating duplicate accounts.

> 💡 **Important:** These credentials are intended for local development, testing, and project demonstration. Do not use seeded demo passwords for a production deployment.

---

### 5. Login

Use the seeded accounts to test each portal.

| Role          | Email                       | Password        | Portal        |
| ------------- | --------------------------- | --------------- | ------------- |
| **Admin**     | `admin@eventsphere.com`     | `Admin@123`     | `/admin/`     |
| **Exhibitor** | `exhibitor@eventsphere.com` | `Exhibitor@123` | `/exhibitor/` |
| **Attendee**  | `attendee@eventsphere.com`  | `Attendee@123`  | `/attendee/`  |

These accounts allow the complete role-based workflow to be demonstrated without manually editing MongoDB documents.

> 🔐 For production, replace/remove demo credentials and create secure administrator accounts using a proper deployment-specific process.

---

## Available Scripts

### Server

Located in `server/package.json`:

| Script                   | Description                   |
| ------------------------ | ----------------------------- |
| `npm start`              | Run the server with Node.js   |
| `npm run dev`            | Run the server with Nodemon   |
| `node seed/seedUsers.js` | Create development/demo users |

### Client

Located in `client/package.json`:

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite development server    |
| `npm run build`   | Create a production build            |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |

---

## Roles & Access

EventSphere uses JWT authentication and role-based authorization.

| Role          | How Created                                   | Portal         |
| ------------- | --------------------------------------------- | -------------- |
| **Attendee**  | Public registration or seed script            | `/attendee/*`  |
| **Exhibitor** | Public registration or seed script            | `/exhibitor/*` |
| **Admin**     | Seed script / controlled administrative setup | `/admin/*`     |

### Security Model

Every protected route is guarded at two levels:

1. **Frontend protection**

   * `ProtectedRoute` checks authentication and role.
   * Users are redirected to the appropriate portal when necessary.

2. **Backend protection**

   * JWT authentication validates the user's identity.
   * `authorize()` independently validates the user's role.
   * Backend authorization remains the actual security boundary.

This prevents users from bypassing frontend restrictions simply by manually requesting protected API endpoints.

---

## Theming

EventSphere includes a complete light/dark theme system based on CSS custom properties.

The theme:

* Supports light mode
* Supports dark mode
* Persists the selected preference using `localStorage`
* Falls back to the visitor's operating-system preference on first visit
* Is available across the public site and all three portals

The main theme styles are maintained in the frontend CSS files.

---

## Maintenance Scripts

### Booth Index Fix

`server/fixBoothIndex.js` is a one-time maintenance script for databases created with an older Booth model where the `event` field was renamed.

Most fresh installations will **not** need this script.

If required:

```bash
cd server
node fixBoothIndex.js
```

---

## Known Limitations

* There is currently no built-in "Forgot Password" email flow. The `User` model contains reserved fields for future password-reset functionality.
* There is currently no automated test suite.
* File uploads are stored on local disk in `server/uploads/`.
* Local file storage is suitable for development and single-server environments but may not persist across redeployments on platforms with ephemeral filesystems.
* Production deployments should use persistent or cloud-based storage such as an object-storage service.
* Demo seed credentials should not be used in production.

---

## Documentation

Additional project documentation is available in the `docs/` directory:

* [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) — API endpoints and request/response details
* [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — application architecture, authentication, authorization, and system design

---

## License

This project is currently provided for educational and demonstration purposes.

Add an appropriate license such as MIT, ISC, or a proprietary license before distributing the project publicly.
