# Centyzz Hair & Beauty Salon Management System

A web-based Salon Management System for **Centyzz Hair & Beauty Salon**.

The system is designed to manage salon operations including clients, appointments, services, staff, inventory, point-of-sale transactions, reports, user accounts, and system administration.

---

## 📁 Project Structure

```text
centyzz/
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── prisma/
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   │
│   ├── test/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── prisma.config.ts
│   ├── tsconfig.json
│   └── ...
│
├── frontend/
│   └── ...
│
├── .gitignore
├── .gitattributes
└── README.md
```

> The `frontend` directory is reserved for the React frontend and will be populated as frontend development progresses.

---

# 🛠️ Technology Stack

## Backend

- NestJS
- TypeScript
- Prisma 8
- PostgreSQL
- Neon PostgreSQL
- JWT
- bcrypt
- class-validator
- class-transformer

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

The frontend and backend are maintained as separate applications inside the same repository.

---

# 🚀 Backend Setup Guide

This section explains how to set up the Centyzz backend on a new computer after cloning the repository.

Follow the steps **in order**.

---

## 1. Install the Required Software

Before cloning the project, install the following:

- Git
- Node.js
- npm

### Git

Download and install Git:

https://git-scm.com/

Verify the installation:

```powershell
git --version
```

Example:

```text
git version 2.x.x
```

### Node.js

Install **Node.js 24 LTS**.

Download:

https://nodejs.org/

After installation, verify:

```powershell
node -v
```

and:

```powershell
npm -v
```

Example:

```text
v24.x.x
11.x.x
```

> Node.js 24 LTS is recommended so that all developers use the same major Node.js version.

---

## 2. Clone the Repository

Open PowerShell or a terminal.

Navigate to the location where you want to store the project.

Example:

```powershell
cd C:\VSC
```

Clone the repository:

```powershell
git clone https://github.com/gorjess-cloud/project-centyzz.git
```

After cloning, enter the project:

```powershell
cd project-centyzz
```

You should now have:

```text
project-centyzz/
├── backend/
├── frontend/
├── .gitignore
├── .gitattributes
└── README.md
```

---

## 3. Enter the Backend Folder

The NestJS backend is located inside:

```text
backend/
```

Run:

```powershell
cd backend
```

Verify that you are inside the backend:

```powershell
Get-ChildItem
```

You should see files such as:

```text
package.json
package-lock.json
prisma.config.ts
src
test
.env.example
```

---

## 4. Install Backend Dependencies

Before running the backend, install its dependencies:

```powershell
npm install
```

This reads the `package.json` and `package-lock.json` files and installs the required packages.

A new folder will be created:

```text
backend/
└── node_modules/
```

> `node_modules` is intentionally excluded from Git. Do **not** commit or push it.

---

## 5. Configure Environment Variables

The backend uses environment variables for:

- Neon database connection
- JWT authentication
- Object storage configuration

The repository contains:

```text
backend/.env.example
```

Create your local `.env` file by running:

```powershell
Copy-Item .env.example .env
```

You should now have:

```text
backend/
├── .env
└── .env.example
```

> `.env` contains private credentials and is ignored by Git. **Do not commit or push `.env` to GitHub.**

---

## 6. Configure the `.env` File

Open the `.env` file:

```powershell
notepad .env
```

Configure the required variables.

Example:

```env
DATABASE_URL="YOUR_NEON_DATABASE_URL"

JWT_SECRET="YOUR_LOCAL_JWT_SECRET"
```

If object storage is required for the current development setup, also configure:

```env
AWS_ENDPOINT_URL_S3="YOUR_S3_ENDPOINT"
AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"
AWS_REGION="YOUR_REGION"
S3_BUCKET="centyzz-files"
```

### Important Security Rule

Never commit your real `.env` file to GitHub.

The following files are ignored by Git:

```text
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

Only this file should be committed:

```text
.env.example
```

---

## 7. Get the Database Credentials

The project uses a **Neon PostgreSQL database**.

You need access to the project's development database before running the backend.

The `DATABASE_URL` should contain the PostgreSQL connection string provided by Neon.

Example format:

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

> Do not copy the example above literally. Use the actual development database connection string provided to your team.

### Important

Do not post your actual `DATABASE_URL` in GitHub, Discord, screenshots, or public chats.

A Neon connection string can contain database credentials.

---

## 8. Verify the Database Connection

Make sure your `.env` contains a valid:

```env
DATABASE_URL="..."
```

Then run:

```powershell
npx prisma migration status
```

This checks whether Prisma can communicate with the configured PostgreSQL database.

If it works, the backend is able to connect to the Neon database.

If it fails, check:

1. `.env` exists.
2. `DATABASE_URL` is correct.
3. The Neon database is available.
4. Your account has access to the development database.
5. There are no extra spaces or quotation errors in `.env`.

---

## 9. Prisma Configuration

The project currently uses **Prisma 8**.

The main Prisma configuration is:

```text
backend/prisma.config.ts
```

The Prisma contract is:

```text
backend/src/prisma/contract.prisma
```

The Prisma-related files are:

```text
backend/src/prisma/
├── contract.prisma
├── contract.json
├── contract.d.ts
└── db.ts
```

The database connection is handled by:

```text
backend/src/prisma/db.ts
```

---

## 10. Generate the Prisma Contract

If the generated Prisma contract files need to be generated or updated, run:

```powershell
npx prisma contract emit
```

This generates or updates the Prisma contract files inside:

```text
src/prisma/
```

After running the command, you should have:

```text
src/prisma/
├── contract.prisma
├── contract.json
├── contract.d.ts
└── db.ts
```

> Do not manually modify generated files unless specifically required.

---

## 11. Start the Backend

Once dependencies and environment variables are configured, start the NestJS development server:

```powershell
npm run start:dev
```

If everything is configured correctly, NestJS should start successfully.

The backend normally runs at:

```text
http://localhost:3000
```

Keep this terminal open while developing.

---

## 12. Verify the Backend

Open a browser and visit:

```text
http://localhost:3000
```

The root route may not have a frontend page yet. That is normal.

The backend is primarily providing REST API endpoints.

The authentication endpoints are located under:

```text
/api/auth
```

---

# 🔐 Authentication API

The current authentication system provides registration and login.

---

## Register

### Endpoint

```http
POST /api/auth/register
```

Full local URL:

```text
http://localhost:3000/api/auth/register
```

### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Required Fields

| Field | Description |
|---|---|
| `firstName` | User's first name |
| `lastName` | User's last name |
| `email` | Valid email address |
| `password` | Password with minimum length requirements |

---

## Login

### Endpoint

```http
POST /api/auth/login
```

Full local URL:

```text
http://localhost:3000/api/auth/login
```

### Request Body

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

A successful login returns:

- JWT access token
- User information
- User role
- Account status

---

# 🔑 Authentication Security

Passwords are hashed using:

```text
bcrypt
```

Passwords are never stored as plain text.

Authentication tokens are generated using:

```text
JWT
```

The JWT secret is stored in:

```env
JWT_SECRET="YOUR_LOCAL_JWT_SECRET"
```

Never commit the real JWT secret to GitHub.

---

# 🧪 Running Tests

The backend contains unit and end-to-end tests.

## Unit Tests

```powershell
npm run test
```

## End-to-End Tests

```powershell
npm run test:e2e
```

## Test Coverage

```powershell
npm run test:cov
```

---

# 🔨 Building the Backend

To create a production build:

```powershell
npm run build
```

The compiled output will be generated in:

```text
dist/
```

The `dist` directory is ignored by Git.

---

# ▶️ Running the Production Build

After building:

```powershell
npm run start:prod
```

---

# 📋 Common Backend Commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run start:dev` | Start development server |
| `npm run build` | Build backend |
| `npm run start:prod` | Run production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run test coverage |
| `npx prisma migration status` | Check database migration status |
| `npx prisma contract emit` | Generate Prisma contract |

---

# 🐛 Troubleshooting

## Problem: `npm install` fails

Check your Node.js version:

```powershell
node -v
```

The recommended version is:

```text
Node.js 24 LTS
```

Then try:

```powershell
npm install
```

---

## Problem: `.env` does not exist

Make sure you are inside:

```text
backend/
```

Then run:

```powershell
Copy-Item .env.example .env
```

---

## Problem: Database connection fails

Run:

```powershell
npx prisma migration status
```

Check:

```text
backend/.env
```

Make sure it contains:

```env
DATABASE_URL="YOUR_NEON_DATABASE_URL"
```

Also make sure the Neon database is accessible.

---

## Problem: JWT authentication does not work

Check:

```text
backend/.env
```

Make sure you have:

```env
JWT_SECRET="YOUR_LOCAL_JWT_SECRET"
```

Restart the development server after changing `.env`:

```powershell
npm run start:dev
```

---

## Problem: Port 3000 is already in use

The backend normally runs on:

```text
http://localhost:3000
```

If another application is already using port 3000, stop that application or configure another port.

---

# 🔄 Git Development Workflow

The main branch is:

```text
main
```

Do not normally make feature changes directly on `main`.

---

## 1. Update Your Local Main Branch

From the project root:

```powershell
cd ..
```

Then:

```powershell
git checkout main
git pull origin main
```

---

## 2. Create a Feature Branch

Create a new branch:

```powershell
git checkout -b feature/your-feature-name
```

Example:

```powershell
git checkout -b feature/auth-login
```

---

## 3. Make Your Changes

Modify the necessary files.

Then check your changes:

```powershell
git status
```

---

## 4. Stage Changes

```powershell
git add .
```

---

## 5. Commit Changes

Example:

```powershell
git commit -m "feat: add login authentication"
```

---

## 6. Push Your Branch

```powershell
git push -u origin feature/auth-login
```

---

## 7. Create a Pull Request

After pushing your feature branch:

1. Open the GitHub repository.
2. Open the newly pushed branch.
3. Create a Pull Request.
4. Set the target branch to `main`.
5. Review the changes.
6. Merge after approval.

---

# 📁 Important Backend Files

### Application Entry Point

```text
backend/src/main.ts
```

Responsible for starting the NestJS application and configuring global validation.

### Application Module

```text
backend/src/app.module.ts
```

The main NestJS module that imports application modules.

### Authentication Module

```text
backend/src/auth/auth.module.ts
```

Handles authentication-related dependencies and configuration.

### Authentication Controller

```text
backend/src/auth/auth.controller.ts
```

Contains:

```text
POST /api/auth/register
POST /api/auth/login
```

### Authentication Service

```text
backend/src/auth/auth.service.ts
```

Handles:

- User registration
- Duplicate email checking
- Password hashing
- Password verification
- JWT generation
- Authentication errors

### Register DTO

```text
backend/src/auth/dto/register.dto.ts
```

Defines validation rules for registration.

### Login DTO

```text
backend/src/auth/dto/login.dto.ts
```

Defines validation rules for login.

### Prisma Database Connection

```text
backend/src/prisma/db.ts
```

Provides the database connection used by the backend.

### Prisma Contract

```text
backend/src/prisma/contract.prisma
```

Defines the database contract/models used by the project.

### Prisma Configuration

```text
backend/prisma.config.ts
```

Contains the Prisma configuration used by the project.

---

# 🔒 Security Rules

Never commit or upload:

```text
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

Never expose:

- Neon database credentials
- Database connection strings
- JWT secrets
- AWS access keys
- AWS secret keys
- API keys
- Other private credentials

Use:

```text
.env.example
```

to document required environment variables without exposing their actual values.

---

# 👥 Development Roles

The system is designed around the following roles:

### Superadmin

Responsible for:

- System administration
- User management
- Audit logs
- System settings
- Database/backups
- Developer-level controls

### Admin / Owner

Responsible for salon management including:

- Dashboard
- Clients
- Appointments
- Services
- Staff
- Inventory
- POS
- Reports
- Settings

### Staff

Primarily handles:

- POS transactions
- Sales-related operations

### Client

Uses the Client Portal for client-related functions such as:

- Profile
- Appointments
- Other client services

> Role-based access control must be enforced by the backend. Frontend route/button hiding alone is not considered sufficient security.

---

# 🏗️ System Architecture

```text
                    CENTYZZ
                       │
             ┌─────────┴─────────┐
             │                   │
         FRONTEND              BACKEND
          React                 NestJS
             │                   │
             │                REST API
             │                   │
             └──────────┬────────┘
                        │
                      Prisma
                        │
                  PostgreSQL
                        │
                      Neon
```

The frontend communicates with the NestJS backend through REST APIs.

The backend handles business logic, authentication, authorization, validation, and database operations.

---

# 📌 Current Backend Status

Current backend implementation includes:

- NestJS project setup
- PostgreSQL database
- Neon cloud database
- Prisma 8
- User model
- Authentication module
- User registration
- User login
- bcrypt password hashing
- JWT access tokens
- DTO validation
- Global validation pipe

Additional system modules will be implemented during development.

---

# 📋 First-Time Setup Checklist

Use this checklist when setting up Centyzz on a new computer:

```text
[ ] Install Git
[ ] Install Node.js 24 LTS
[ ] Clone the repository
[ ] Open the project folder
[ ] Enter the backend folder
[ ] Run npm install
[ ] Create .env from .env.example
[ ] Configure DATABASE_URL
[ ] Configure JWT_SECRET
[ ] Configure storage variables if required
[ ] Verify Neon database access
[ ] Run npx prisma migration status
[ ] Run npx prisma contract emit if required
[ ] Run npm run start:dev
[ ] Verify the NestJS server starts
[ ] Test the authentication endpoints
```

---

# 🌐 Repository

**GitHub Repository:**

https://github.com/gorjess-cloud/project-centyzz

**Main Branch:**

```text
main
```

---

# 📌 Development Status

**Centyzz Hair & Beauty Salon Management System** is currently under active development.

The backend is being developed first, with the frontend being developed alongside the API and system modules.

More modules and features will be added as development continues.
