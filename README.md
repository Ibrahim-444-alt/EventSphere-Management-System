# EventSphere Management System

A full-stack Event & Expo Management Platform with three dedicated portals — **Admin, Exhibitor, and Attendee** — built using the MERN Stack (MongoDB, Express.js, React.js, and Node.js).

EventSphere helps organizers manage the complete event and expo process from one platform. Organizers can publish events, manage exhibitor applications, assign booths, create speaker schedules, manage attendee registrations, handle check-ins, and collect feedback.

Exhibitors and attendees also have their own dedicated portals to manage their activities.

## 🌐 Live Demo

| Resource | Link |
|---|---|
| **Live Website** | [EventSphere Live](https://event-sphere-management-system-ibka.vercel.app/) |
| **Backend API** | [Backend Deployment](https://eventsphere-backend-kmmpvewsu-ibka.vercel.app/) |
| **GitHub Repository** | [View Source Code](https://github.com/Ibrahim-444-alt/EventSphere-Management-System) |

**Deployment:** Frontend and Backend are deployed separately using Vercel. MongoDB Atlas is used for cloud database hosting.

---

## 📋 Table of Contents

- [Features](#features)
- [Responsive Design](#responsive-design)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone & Install](#1-clone--install)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Run the App](#3-run-the-app)
  - [4. Seed Demo Users](#4-seed-demo-users)
  - [5. Login](#5-login)
- [Available Scripts](#available-scripts)
- [Roles & Access](#roles--access)
- [Theming](#theming)
- [Maintenance Scripts](#maintenance-scripts)
- [Known Limitations](#known-limitations)
- [Documentation](#documentation)
- [License](#license)

---

## ✨ Features

### 🌐 Public Website

- Home page with event statistics.
- Event listing and event detail pages.
- Public speaker directory.
- Speaker sessions and event schedules.
- Public attendee feedback section.
- Average event ratings.
- Contact form.
- Light and Dark theme support.

### 🛠️ Admin Portal

- **Event Management** — Create, edit, publish, and delete events.
- **Exhibitor Management** — Review applications and approve or reject exhibitors.
- **Booth Management** — Create and manage booths for different events.
- **Interactive Floor Plan** — Assign, reassign, and release exhibitor booths.
- **Booth Status** — Available, Reserved, Occupied, Pending, and Maintenance.
- **Speaker Management** — Add and manage event speakers.
- **Schedule Management** — Create and manage sessions with double-booking prevention.
- **Attendee Management** — Register walk-in attendees, search records, and manage check-ins.
- **Feedback Management** — Approve or hide attendee feedback.
- **Contact Inquiries** — Manage and respond to contact form submissions.
- **Analytics Dashboard** — View registrations, exhibitors, booths, ratings, and recent activity.
- **CSV Reports** — Export attendee, exhibitor, booth, session, and feedback data.
- **Settings** — Manage organization information and registration settings.

### 🏢 Exhibitor Portal

- Apply to participate in available events.
- Track application status.
- Manage company profile.
- Upload company logo.
- Add company description and category.
- Manage products and services.
- Manage staff information.
- View assigned booth details.

### 🎟️ Attendee Portal

- Browse available events.
- Register for events.
- View personal registrations.
- Cancel registrations.
- Browse event schedules.
- Bookmark sessions.
- Create a personal event agenda.
- Submit event and session feedback.
- Manage personal profile.

---

## 📱 Responsive Design

EventSphere has different levels of responsive support.

### Public Website

The following public pages support mobile screens:

- Home Page
- About Page
- Other public website sections.

### Admin, Exhibitor & Attendee Dashboards

The three dashboards are currently designed mainly for desktop and laptop screens.

- Admin Dashboard
- Exhibitor Dashboard
- Attendee Dashboard

These dashboards are not fully optimized for mobile screens.

**Mobile Access:** Users can enable the "Desktop Site" option from their mobile browser menu (three dots) to view the desktop dashboard layout.

Full mobile responsiveness for all three dashboards is a planned improvement.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Routing | React Router 7 |
| Build Tool | Vite |
| HTTP Client | Axios |
| Backend | Node.js |
| Server Framework | Express 4 |
| Database | MongoDB |
| ODM | Mongoose 8 |
| Authentication | JWT |
| Password Security | bcryptjs |
| File Uploads | Multer |
| Email | Nodemailer |
| Styling | CSS Custom Properties |
| Deployment | Vercel |
| Version Control | Git & GitHub |

---

## 📁 Project Structure

```text
EventSphere-Management-System/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   │   ├── MainLayout
│   │   │   ├── AdminLayout
│   │   │   ├── ExhibitorLayout
│   │   │   └── AttendeeLayout
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   ├── admin/
│   │   │   ├── exhibitor/
│   │   │   └── attendee/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   │
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed/
│   │   └── seedUsers.js
│   ├── utils/
│   ├── uploads/
│   ├── fixBoothIndex.js
│   ├── server.js
│   └── package.json
│
├── docs/
│   ├── API_REFERENCE.md
│   └── ARCHITECTURE.md
│
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run EventSphere on your local machine.

### Prerequisites

Before running the project, install:

- Node.js 18 or later.
- MongoDB Community Server or MongoDB Atlas.
- Git.
- npm (comes with Node.js).

An SMTP account is optional. The application supports an Ethereal test inbox during development when SMTP credentials are not provided.

---

### 1. Clone & Install

Clone the repository:

```bash
git clone https://github.com/Ibrahim-444-alt/EventSphere-Management-System.git
```

Open the project folder:

```bash
cd EventSphere-Management-System
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

---

### 2. Configure Environment Variables

Create a `.env` file inside the `server` directory.

```env
# Server Configuration
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/eventsphere

# JWT Authentication
JWT_SECRET=replace-this-with-a-long-random-secret

# Email Configuration
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM="EventSphere <no-reply@eventsphere.local>"
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| PORT | No | Backend server port. Default is 5000. |
| MONGO_URI | Yes | MongoDB connection string. |
| JWT_SECRET | Yes | Secret used for JWT authentication. |
| EMAIL_USER | No | SMTP username or email. |
| EMAIL_PASSWORD | No | SMTP password or app password. |
| EMAIL_HOST | No | SMTP server host. |
| EMAIL_PORT | No | SMTP server port. |
| EMAIL_FROM | No | Sender email address. |

**Security:** Never upload your `.env` file, database credentials, or real passwords to GitHub.

### Optional Client Environment Variable

Create a `.env` file inside the `client` directory only if your backend uses a different API address.

```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Run the App

Open two separate terminals.

**Terminal 1 — Backend**

```bash
cd server
npm run dev
```

Backend default address:

```text
http://localhost:5000
```

**Terminal 2 — Frontend**

```bash
cd client
npm run dev
```

Frontend default address:

```text
http://localhost:5173
```

Open the frontend URL in your browser to use EventSphere.

---

### 4. Seed Demo Users

EventSphere includes a seed script to create demo accounts for all three user roles.

Make sure MongoDB is running, then execute:

```bash
cd server
node seed/seedUsers.js
```

The script creates demo accounts for:

- Admin
- Exhibitor
- Attendee

These accounts are intended for local development and project demonstrations.

---

### 5. Login

After creating the demo users, open the application and use the appropriate demo account for each portal.

| Role | Portal |
|---|---|
| Admin | `/admin/` |
| Exhibitor | `/exhibitor/` |
| Attendee | `/attendee/` |

Demo login credentials are defined in the seed script. Check `server/seed/seedUsers.js` for local testing credentials.

Do not use demo credentials in a production environment.

---

## ⚙️ Available Scripts

### Server Scripts

Located in `server/package.json`.

| Command | Description |
|---|---|
| `npm start` | Start the backend server. |
| `npm run dev` | Start the server using Nodemon. |
| `node seed/seedUsers.js` | Create demo users. |

### Client Scripts

Located in `client/package.json`.

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server. |
| `npm run build` | Create production build. |
| `npm run preview` | Preview production build locally. |
| `npm run lint` | Run ESLint. |

---

## 🔐 Roles & Access

EventSphere uses JWT authentication and role-based authorization.

| Role | Account Creation | Portal |
|---|---|---|
| Attendee | Public registration or seed script | `/attendee/*` |
| Exhibitor | Public registration or seed script | `/exhibitor/*` |
| Admin | Seed script or controlled administrative setup | `/admin/*` |

### Security Model

Protected routes use two levels of security.

**1. Frontend Protection**

- `ProtectedRoute` checks user authentication.
- Role-based access controls portal navigation.
- Unauthorized users are redirected appropriately.

**2. Backend Protection**

- JWT authentication validates user identity.
- `authorize()` middleware checks user roles.
- Backend authorization protects sensitive API endpoints.

Backend authorization is the main security layer. Users cannot gain access to protected backend resources simply by changing frontend URLs.

---

## 🎨 Theming

EventSphere includes a Light and Dark theme system.

Features:

- Light Mode.
- Dark Mode.
- Theme preference saved using `localStorage`.
- Supports the visitor's operating system preference on first visit.
- Available across the public website and all three portals.

Theme styles are managed using CSS custom properties.

---

## 🔧 Maintenance Scripts

### Booth Index Fix

The project includes a maintenance script:

```text
server/fixBoothIndex.js
```

This script fixes an older Booth database index where the `event` field was renamed.

Most fresh installations do not need this script.

If required, execute:

```bash
cd server
node fixBoothIndex.js
```

---

## ⚠️ Known Limitations

The following improvements are not currently included in the project:

- There is no built-in Forgot Password email functionality.
- There is currently no automated test suite.
- File uploads are stored locally in `server/uploads/`.
- Local file storage may not persist after redeployment on platforms with temporary file systems.
- Production deployments should use persistent or cloud-based file storage.
- Admin, Exhibitor, and Attendee dashboards are not fully mobile responsive.
- The three dashboards are currently designed mainly for desktop and laptop screens.
- Demo credentials should not be used in production.

---

## 📚 Documentation

Additional technical documentation is available in the `docs` directory.

| File | Description |
|---|---|
| [API_REFERENCE.md](docs/API_REFERENCE.md) | API endpoints and request/response details. |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Application architecture, authentication, authorization, and system design. |

---

## 📄 License

This project is currently developed for educational and demonstration purposes.

An appropriate license such as MIT, ISC, or a proprietary license should be added before distributing the project publicly.

---

## 👨‍💻 Author

**Ibrahim Khalid**

GitHub: [Ibrahim-444-alt](https://github.com/Ibrahim-444-alt)

Project: [EventSphere Management System](https://github.com/Ibrahim-444-alt/EventSphere-Management-System)
