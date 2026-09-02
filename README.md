# Ignite — Web

**Ignite** is a modern Human Resource Management System designed to streamline employee management, attendance, leave, payroll, recruitment, organization management, and other workforce operations in one platform.

This repository contains the **web frontend** of Ignite HRMS, built using **React.js and Vite**.

---

## 🚀 Tech Stack

* **React.js** — Frontend UI
* **Vite** — Development and build tooling
* **React Router** — Client-side routing
* **Axios** — API communication
* **Firebase** — Authentication and supporting services
* **CSS** — Custom styling and centralized design system
* **Manrope** — Primary typography

---

## 📁 Project Structure

```text
Ignite-web/
│
├── public/
│
├── src/
│   │
│   ├── assets/
│   │   └── landing/
│   │
│   ├── components/
│   │   ├── landingPage/
│   │   ├── layout/
│   │   ├── organization/
│   │   └── ProtectedRoute/
│   │
│   ├── pages/
│   │   ├── landingPage/
│   │   ├── auth/
│   │   └── OrganizationSetup/
│   │
│   ├── services/
│   │   └── api/
│   │       ├── axios.js
│   │       └── authAPI.js
│   │
│   ├── styles/
│   │   └── global.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

# ✨ Current Features

## 🌐 Website

* Landing page
* Contact page
* Responsive UI
* Ignite branding
* Centralized design system
* Reusable UI components

---

## 🔐 Authentication

Ignite follows an **invitation-based authentication model** rather than allowing public registration.

Current authentication functionality includes:

* Login
* Forgot Password
* Reset Password
* Invitation-based account setup
* Account creation
* Protected routes
* Authentication API integration
* Centralized Axios API configuration

### Authentication Flow

```text
Organization Purchase
        ↓
Invitation
        ↓
Invitation Verification
        ↓
Create Account
        ↓
Authentication
        ↓
Company Setup
        ↓
Dashboard
```

---

# 🏢 Company Setup

The **Company Setup** flow is used when an organization is initially created and its foundational information needs to be configured before entering the main dashboard.

Current setup sections include:

* Company Details
* Address
* Business Settings
* Setup Review
* Account Created / Completion

### Company Setup Flow

```text
Create Organization
        ↓
Company Details
        ↓
Address
        ↓
Business Settings
        ↓
Review
        ↓
Setup Complete
        ↓
Dashboard
```

---

# 🏗️ Organization Setup

**Company Setup** and **Organization Setup** serve different purposes.

### Company Setup

Used during the initial organization onboarding process.

```text
Company Information
        ↓
Address
        ↓
Business Configuration
        ↓
Review
        ↓
Complete
```

### Organization Setup

Used from within the dashboard to configure the organization's operational structure.

Examples include:

* Departments
* Designations
* Roles
* Employee structure
* Organization-level configuration

The Organization Setup module will progressively expand as the backend APIs and dashboard functionality are implemented.

---

# 📊 Dashboard

The dashboard provides the foundation for managing the organization after initial setup.

Current dashboard foundation includes:

* Admin dashboard layout
* Fixed sidebar navigation
* Top navigation
* Protected dashboard routes
* Organization setup navigation
* Reusable layout components
* Progress indicators
* Organization management components

Additional dashboard modules are being implemented progressively.

---

# 🔌 API Architecture

The frontend communicates with backend services through a centralized Axios configuration.

```text
React Components
        ↓
Pages
        ↓
API Services
        ↓
Axios Instance
        ↓
Ignite Backend APIs
        ↓
Database / Services
```

API-related code is maintained inside:

```text
src/services/api/
```

Current API services include:

```text
axios.js
authAPI.js
```

The API layer will be expanded as additional Ignite HRMS modules are implemented.

---

# 🛡️ Protected Routes

Authenticated application areas are protected using a reusable `ProtectedRoute` component.

The general routing structure follows:

```text
Public Routes
    │
    ├── Landing Page
    ├── Contact
    ├── Login
    ├── Forgot Password
    ├── Reset Password
    └── Account Setup
            │
            ↓
      Authentication
            │
            ↓
Protected Routes
    │
    ├── Company Setup
    ├── Dashboard
    └── Organization Setup
```

Authentication and organization state will determine the appropriate application flow as the backend APIs are integrated.

---

# 🛠️ Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js 20+
* npm

Check your versions:

```bash
node -v
npm -v
```

---

# 📦 Installation

Clone the repository:

```bash
git clone https://github.com/devgrassfrontbizzeazy-code/Ignite-web.git
```

Navigate into the project:

```bash
cd Ignite-web
```

Install dependencies:

```bash
npm install
```

---

# ▶️ Run Development Server

Start the Vite development server:

```bash
npm run dev
```

The application will be available at the local URL shown by Vite, usually:

```text
http://localhost:5173
```

---

# 🏗️ Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

# 🔄 Development Workflow

Ignite follows a Git-based development workflow.

```text
Developer
    ↓
Create / Modify Feature
    ↓
Test Locally
    ↓
git add .
    ↓
git commit
    ↓
git push
    ↓
GitHub
    ↓
Netlify
    ↓
Automatic Deployment
```

Every push to the configured production branch triggers a new Netlify deployment.

---

# 🎨 Design System

Ignite uses a centralized design system to maintain visual consistency across the application.

## Primary Brand Colors

```text
Orange: #F47C20
Navy:   #0F2B46
```

The design system centralizes:

* Colors
* Typography
* Spacing
* Border radius
* Shadows
* Transitions
* Component states
* Form styles
* Buttons
* Layout behavior

Global styles are maintained in:

```text
src/styles/global.css
```

---

# 🧩 Planned Modules

Ignite HRMS is being developed around the following core modules:

### Core HRMS

* Authentication & Identity
* Organization Management
* Employee Management
* Attendance Management
* Leave Management
* Payroll
* Recruitment
* Performance Management
* Role-Based Access Control

### Organization Administration

* Departments
* Designations
* Roles & Permissions
* Employee Import
* Organization Settings

Additional modules and functionality will be introduced progressively.

---

# 🔐 Authentication Architecture

Ignite uses an **invitation-based account creation model**.

Public registration is not part of the planned authentication flow.

```text
Organization Purchase
        ↓
Invitation Generated
        ↓
Invitation Email
        ↓
Invitation Verification
        ↓
Create Account
        ↓
Authentication
        ↓
Company Setup
        ↓
Organization Configuration
        ↓
Dashboard
```

Authentication and API handling are being integrated progressively with the Ignite backend.

---

# 🌐 Deployment

The Ignite HRMS web frontend is deployed using **Netlify**.

The deployment pipeline is connected to the GitHub repository.

```text
GitHub
   ↓
Push to Production Branch
   ↓
Netlify Build
   ↓
Production Deployment
```

---

# 📌 Project Status

🚧 **Under Active Development**

Ignite HRMS is currently under active development.

Current development focus includes:

* Authentication API integration
* Protected routing
* Company setup flow
* Organization setup
* Dashboard foundation
* API service architecture
* Organization management
* Backend integration

Future development will progressively introduce:

* Employee management
* Attendance
* Leave management
* Payroll
* Recruitment
* Performance management
* RBAC
* Advanced organization administration

---

# 👨‍💻 Development

Ignite HRMS is maintained by the **DevGrassFrontBizzeazy** team.

---

# 📄 License

This project is proprietary software developed for **DevGrassFrontBizzeazy**.

Unauthorized copying, distribution, modification, or commercial use is not permitted.
