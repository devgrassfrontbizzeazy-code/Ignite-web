#  Ignite HRMS — Web

**Ignite HRMS** is a modern Human Resource Management System designed to streamline employee management, attendance, leave, payroll, recruitment, and other workforce operations in one platform.

This repository contains the **web frontend** of Ignite HRMS, built with React and Vite.

---

## 🚀 Tech Stack

* **React.js** — Frontend UI
* **Vite** — Development & build tooling
* **React Router** — Client-side routing
* **Axios** — API communication
* **CSS** — Custom styling and design system
* **Manrope** — Primary typography

---

## 📁 Project Structure

```text
Ignite-web/
│
├── public/
│
├── src/
│   ├── assets/
│   │   └── landing/
│   │
│   ├── components/
│   │   ├── landingPage/
│   │   ├── dashboard/
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── landingPage/
│   │   ├── auth/
│   │   └── dashboard/
│   │
│   ├── layouts/
│   │
│   ├── styles/
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── vite.config.js
└── README.md
```

---

## ✨ Current Features

### Website

* Landing page
* Contact page
* Responsive UI
* Ignite branding and design system

### Authentication

* Login
* Forgot Password
* Reset Password
* Invitation-based account setup
* Account creation flow

### Organization Setup

* Company details
* Address configuration
* Business settings
* Setup review
* Account creation confirmation
* Organization setup progress

### Dashboard

* Admin dashboard foundation
* Sidebar navigation
* Top navigation bar
* Organization setup section
* Reusable UI components
* Progress indicators

---

## 🛠️ Getting Started

### Prerequisites

Make sure you have installed:

* Node.js 20+
* npm

Check your versions:

```bash
node -v
npm -v
```

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/devgrassfrontbizzeazy-code/Ignite-web.git
```

Navigate to the project:

```bash
cd Ignite-web
```

Install dependencies:

```bash
npm install
```

---

## ▶️ Run Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at the local URL shown by Vite, usually:

```text
http://localhost:5173
```

---

## 🏗️ Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🔄 Development Workflow

The project follows a Git-based development workflow.

```text
Developer
    ↓
Create / modify feature
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

## 🎨 Design System

Ignite follows a centralized design system to maintain consistency across the application.

### Primary Brand Colors

```text
Orange: #F47C20
Navy:   #0F2B46
```

The project also uses centralized CSS variables for:

* Colors
* Typography
* Spacing
* Border radius
* Shadows
* Transitions
* Component states

---

## 🧩 Planned Modules

Ignite HRMS is being developed around the following core modules:

* Authentication & Identity
* Employee Management
* Attendance Management
* Leave Management
* Payroll
* Recruitment
* Performance Management
* Role-Based Access Control
* Organization Management

---

## 🔐 Authentication

Ignite uses an **invitation-based account setup flow** rather than public registration.

The planned authentication flow is:

```text
Organization Purchase
        ↓
Invitation Email
        ↓
Invitation Verification
        ↓
Create Account
        ↓
Firebase Authentication
        ↓
Organization Setup
        ↓
Dashboard
```

---

## 🌐 Deployment

The frontend is deployed using **Netlify**.

Production deployments are connected to the GitHub repository and are triggered automatically when changes are pushed to the configured branch.

---

## 📌 Project Status

🚧 **Under Active Development**

Ignite HRMS is currently being developed and additional modules, API integrations, authentication, RBAC, and backend functionality will be added progressively.

---

## 👨‍💻 Development

Ignite HRMS is maintained by the **DevGrassFrontBizzeazy** team.

---

## 📄 License

This project is proprietary software developed for **DevGrassFrontBizzeazy**.

Unauthorized copying, distribution, or commercial use is not permitted.
