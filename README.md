# Ignite — Web

**Ignite** is a modern Human Resource Management System designed to streamline employee management, attendance, leave, payroll, recruitment, organization management, and other workforce operations in one platform.

This repository contains the **web frontend** of Ignite HRMS, built using **React.js and Vite**.

---

## 🚀 Tech Stack

* **React.js** — Frontend UI
* **Vite** — Development and build tooling
* **React Router** — Client-side routing
* **Axios** — API communication
* **Django REST APIs** — Backend integration
* **JWT Authentication** — Authentication and protected API access
* **Cloudinary** — Company logo/image storage
* **Google Maps API** — Address and map location selection
* **Lucide React** — UI icons
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
│   │   ├── auth/
│   │   │   ├── ProtectedRoute/
│   │   │   └── CompanySetupGuard/
│   │   │
│   │   ├── common/
│   │   │   ├── EmptyState/
│   │   │   ├── FormField/
│   │   │   ├── Modal/
│   │   │   ├── PageHeader/
│   │   │   ├── SearchInput/
│   │   │   ├── Select/
│   │   │   ├── StatCard/
│   │   │   └── Toggle/
│   │   │
│   │   ├── departments/
│   │   ├── designations/
│   │   ├── landingPage/
│   │   └── layout/
│   │
│   ├── context/
│   │   └── OrganizationContext/
│   │
│   ├── pages/
│   │   ├── landingPage/
│   │   ├── auth/
│   │   │   ├── Login/
│   │   │   ├── ForgotPassword/
│   │   │   ├── ResetPassword/
│   │   │   └── CreateAccount/
│   │   │
│   │   ├── companySetup/
│   │   │   ├── CompanyDetails/
│   │   │   ├── Address/
│   │   │   ├── BusinessSettings/
│   │   │   ├── Review/
│   │   │   ├── AccountCreated/
│   │   │   ├── CompanySetupLayout/
│   │   │   └── CompanySetupContext.jsx
│   │   │
│   │   ├── departments/
│   │   ├── designations/
│   │   └── organizationSetup/
│   │
│   ├── services/
│   │   └── api/
│   │       ├── axios.js
│   │       ├── authAPI.js
│   │       └── companyAPI.js
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

# 🔐 Authentication

Ignite follows an **invitation-based authentication model** rather than allowing unrestricted public registration.

Current authentication functionality includes:

* Login
* Forgot Password
* OTP verification
* Reset Password
* Invitation-based account setup
* Account creation
* JWT token handling
* Protected application routes
* Company setup verification
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
Login
        ↓
Check Company Setup
        ↓
 ┌───────────────┐
 │               │
Company Exists   No Company
 │               │
 ↓               ↓
Dashboard      Company Setup
```

---

# 🔑 Forgot Password

The forgot password functionality is integrated with the Ignite backend.

### Flow

```text
Forgot Password
       ↓
Enter Email
       ↓
Send OTP
       ↓
Enter OTP
       ↓
Verify OTP
       ↓
Receive Reset Token
       ↓
Reset Password
       ↓
Password Updated
```

The reset token is passed securely through React Router state rather than exposing it in the URL.

---

# 🏢 Company Setup

The **Company Setup** flow is used during the initial organization onboarding process.

Current setup sections include:

* Company Details
* Address
* Business Settings
* Setup Review
* Account Created / Completion

### Company Setup Flow

```text
Company Details
        ↓
Address
        ↓
Business Settings
        ↓
Review
        ↓
Submit Setup
        ↓
Backend Validation
        ↓
Company Created
        ↓
Account Created
        ↓
Dashboard
```

---

## 📋 Company Details

The Company Details section supports organization information such as:

* Company name
* Company code
* Industry
* Company type
* Company email
* Phone
* Website
* Registration number
* Company logo

Company logos are submitted as files using `FormData` and processed by the backend.

---

## 📍 Address

The Address section supports:

* Full address
* Country
* State / Province
* City
* Postal code
* Map location

Google Maps integration allows users to select a location directly from the map.

The selected coordinates are stored as the company's map location.

---

## ⚙️ Business Settings

Business configuration currently includes:

* Financial year
* Currency
* Time zone
* Date format
* Week starts on

---

# 🔌 Company Setup API Integration

Company setup is integrated with the Ignite Django REST backend.

The frontend submits the setup information through:

```text
POST /api/company/setup/
```

The request supports:

```text
multipart/form-data
```

when a company logo is included.

### Setup Architecture

```text
Company Setup React Pages
          ↓
CompanySetupContext
          ↓
Review
          ↓
FormData
          ↓
companyAPI.js
          ↓
Axios
          ↓
Django REST API
          ↓
CompanyDetails Serializer
          ↓
Cloudinary
          ↓
PostgreSQL
```

Company logo files are uploaded to Cloudinary by the backend and the resulting secure URL is stored with the company record.

---

# 🔄 Company Setup Detection

The application uses the backend as the **source of truth** for determining whether a user has completed company setup.

The frontend checks:

```text
GET /api/company/
```

### Existing Company

```text
GET /api/company/
        ↓
HTTP 200
        ↓
Company Exists
        ↓
Dashboard
```

### No Company

```text
GET /api/company/
        ↓
HTTP 404
        ↓
Company Not Configured
        ↓
Company Setup
```

The application does not rely on a local storage flag such as `companySetupComplete` to determine the actual company setup state.

---

# 🛡️ Protected Routes

Authenticated application areas are protected using reusable route guards.

### Protected Route

`ProtectedRoute` verifies that an authentication token exists before allowing access to protected application routes.

```text
User
 ↓
ProtectedRoute
 ↓
Access Token?
 ├── No  → Login
 └── Yes → Continue
```

### Company Setup Guard

`CompanySetupGuard` verifies whether the authenticated user has an existing company.

```text
Authenticated User
        ↓
CompanySetupGuard
        ↓
GET /api/company/
        ↓
 ┌───────────────┐
 │               │
200             404
 │               │
 ↓               ↓
Dashboard     Company Setup
```

This prevents users who have already completed company setup from manually returning to the setup workflow.

---

# 🧭 Application Routing

The current routing structure separates public, setup, and authenticated application areas.

```text
Public
│
├── /
├── /contact
├── /login
├── /forgot-password
├── /reset-password
└── /signup
│
↓
Authenticated
│
├── Company Setup
│   ├── /company-setup/company-details
│   ├── /company-setup/address
│   ├── /company-setup/business-settings
│   ├── /company-setup/review
│   └── /company-setup/account-created
│
└── Application
    ├── /dashboard
    ├── /organization-setup
    ├── /departments
    ├── /designations
    ├── /roles-permissions
    ├── /employees
    ├── /attendance
    ├── /leaves
    ├── /holidays
    └── /settings
```

---

# 🏗️ Organization Management

Organization management provides the administrative structure required to manage an organization's workforce.

Current implemented organization modules include:

* Departments
* Designations

Additional organization functionality is being progressively integrated.

---

# 🏢 Departments

The Departments module provides organization-level department management.

Current functionality includes:

* Department listing
* Add department
* View department
* Edit department
* Delete department
* Search / filtering foundation
* Empty state
* Statistics card
* Reusable modal and form components

### Department Flow

```text
Departments
     ↓
View Department List
     ↓
 ┌───────────────┐
 │               │
Add             Existing
 │               │
 ↓               ↓
Create         View/Edit/Delete
```

---

# 👔 Designations

The Designations module provides organization-level designation management.

Current functionality includes:

* Designation listing
* Add designation
* View designation
* Edit designation
* Delete designation
* Reusable form components
* Modal-based operations
* Empty state
* Search functionality foundation
* Statistics card

### Designation Flow

```text
Designations
      ↓
View Designation List
      ↓
 ┌───────────────┐
 │               │
Add             Existing
 │               │
 ↓               ↓
Create         View/Edit/Delete
```

---

# 🧩 Reusable Components

Ignite uses reusable common components to maintain consistency across modules.

Current reusable components include:

* `EmptyState`
* `FormField`
* `Modal`
* `PageHeader`
* `SearchInput`
* `Select`
* `StatCard`
* `Toggle`

These components are designed to reduce duplicated UI logic and provide a consistent user experience across HRMS modules.

---

# 📊 Dashboard

The dashboard provides the foundation for managing the organization after initial company setup.

Current dashboard foundation includes:

* Admin dashboard layout
* Sidebar navigation
* Top navigation
* Protected dashboard routes
* Organization navigation
* Reusable layout components
* Organization management navigation
* Dashboard content foundation

Additional dashboard functionality will be introduced as HRMS modules are implemented.

---

# 🔌 API Architecture

The frontend communicates with the Ignite backend through a centralized Axios instance.

```text
React Components
        ↓
Pages
        ↓
API Services
        ↓
Axios Instance
        ↓
Ignite Django REST APIs
        ↓
PostgreSQL / Cloudinary
```

API-related code is maintained inside:

```text
src/services/api/
```

Current API services include:

```text
axios.js
authAPI.js
companyAPI.js
```

### `axios.js`

The centralized Axios instance handles:

* Backend base URL
* JWT access token
* Authorization headers
* API communication

### `authAPI.js`

Handles authentication-related API requests including:

* Login
* Signup OTP
* Signup OTP verification
* Account completion
* Forgot password OTP
* Forgot password OTP verification
* Password reset

### `companyAPI.js`

Handles company-related API requests including:

* Get company details
* Get company options
* Create/update company setup
* Update company details

---

# 🔐 Authentication Architecture

Ignite uses an **invitation-based account creation model**.

Public registration is not part of the planned production authentication flow.

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
Login
        ↓
JWT Tokens
        ↓
Company Setup Check
        ↓
Company Configuration
        ↓
Dashboard
```

Authentication tokens are stored on the client and automatically attached to authenticated API requests through the centralized Axios instance.

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

The primary application font is:

```text
Manrope
```

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
git add -A
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

# 🌐 Deployment

The Ignite HRMS web frontend is deployed using **Netlify**.

The deployment pipeline is connected to the GitHub repository.

```text
GitHub
   ↓
Push to Production Branch
   ↓
Netlify
   ↓
npm install
   ↓
npm run build
   ↓
Production Deployment
```

---

# 🧱 Backend Integration

Ignite Web communicates with a Django REST backend.

The backend currently provides APIs for authentication and company management, with additional HRMS APIs being introduced progressively.

### Current Integration

```text
Ignite Web
    ↓
Axios
    ↓
Django REST Framework
    ↓
PostgreSQL
    ↓
Cloudinary
```

The backend is responsible for:

* Authentication
* JWT token generation
* Password management
* Company setup
* Company validation
* Company logo upload
* Organization data
* Database persistence

---

# 🧩 Planned Modules

Ignite HRMS is being developed around the following core modules.

## Core HRMS

* Authentication & Identity
* Organization Management
* Employee Management
* Attendance Management
* Leave Management
* Payroll
* Recruitment
* Performance Management
* Role-Based Access Control

## Organization Administration

* Departments
* Designations
* Roles & Permissions
* Employee Import
* Organization Settings

## Workforce Management

* Employee Profiles
* Attendance Tracking
* Leave Requests
* Holiday Management
* Payroll Processing

Additional modules and functionality will be introduced progressively.

---

# 📌 Project Status

🚧 **Under Active Development**

Current implemented functionality includes:

* Landing page
* Contact page
* Authentication screens
* Login API integration
* Forgot Password API integration
* OTP verification
* Reset Password API integration
* Protected routes
* Company setup workflow
* Company setup backend integration
* Company logo upload
* Cloudinary integration
* Google Maps address selection
* Backend-driven company setup verification
* Dashboard foundation
* Organization setup foundation
* Departments CRUD
* Designations CRUD
* Reusable common components
* Centralized API architecture

### Current Development Focus

The next development phases include:

* Employee Management
* Employee onboarding
* Roles & Permissions
* Attendance
* Leave Management
* Holiday Management
* Payroll
* Recruitment
* Performance Management
* Advanced RBAC

---

# 👨‍💻 Development

Ignite HRMS is maintained by the **DevGrassFrontBizzeazy** team.

---

# 📄 License

This project is proprietary software developed for **DevGrassFrontBizzeazy**.

Unauthorized copying, distribution, modification, or commercial use is not permitted.

```

One correction from your old README is especially important: `ProtectedRoute` is **no longer directly under `src/components/ProtectedRoute/`**. It now belongs under the authentication components along with `CompanySetupGuard`.

Also, your README now accurately reflects that **Departments and Designations are actually implemented**, rather than listing them only as planned work.
```
