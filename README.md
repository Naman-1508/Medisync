# MediSync - Medical Appointment Scheduling System

A full-stack medical appointment scheduling system built with React (TypeScript), Node.js, Express, and MongoDB.

## Features

- **Patient Features:**
  - User registration and authentication
  - Browse and book appointments with doctors
  - View appointment history
  - Cancel appointments
  - View medical history

- **Doctor Features:**
  - Doctor registration (requires admin approval)
  - View and manage appointments
  - Complete appointments with diagnosis and prescriptions
  - View appointment statistics

- **Admin Features:**
  - Approve/reject doctor registrations
  - View system analytics
  - Manage all users
  - View top doctors and appointment statistics

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- React Toastify
- Lucide React (Icons)
- date-fns

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Express Validator

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

   This will install dependencies for:
   - Root project
   - Server (backend)
   - Client (frontend)

3. **Set up environment variables:**

   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/medisync
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
   JWT_EXPIRE=30m
   COOKIE_NAME=token
   ```

   **Important:** Change the JWT secrets to secure random strings in production!

4. **Start MongoDB:**
   
   Make sure MongoDB is running on your system. If using MongoDB Atlas, update the `MONGO_URI` in the `.env` file.

## Running the Application

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:5173`

### Production Mode

1. Build the frontend:
   ```bash
   cd client
   npm run build
   ```

2. Start the backend:
   ```bash
   cd server
   npm start
   ```

## Usage

1. **Create an Admin Account:**
   
   After setting up the database, create an admin user:
   ```bash
   cd server
   npm run create-admin
   ```
   
   This will create an admin user with:
   - Email: `admin@medisync.com`
   - Password: `admin123`
   
   **⚠️ Important:** Change the password after first login!
   
   Alternatively, you can manually create an admin user by registering through the UI and then updating the user's role to 'admin' in the database.

2. **Register as Patient or Doctor:**
   - Visit `http://localhost:5173/register`
   - Choose your role (Patient or Doctor)
   - Fill in the registration form

3. **Doctor Approval:**
   - Doctors need admin approval before they can access their dashboard
   - Admin can approve/reject doctors from the admin dashboard

4. **Book Appointments:**
   - Patients can browse available doctors
   - Select a date and time slot
   - Add symptoms and notes
   - Confirm booking

5. **Manage Appointments:**
   - Doctors can view upcoming appointments
   - Complete appointments with diagnosis and prescriptions
   - View appointment history

## Project Structure

```
MediSync/
├── client/                 # React frontend (TypeScript)
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Express backend
│   ├── middleware/        # Auth middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── server.js         # Server entry point
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Doctors
- `GET /api/doctors` - Get all approved doctors
- `GET /api/doctors/:id` - Get single doctor
- `GET /api/doctors/me/appointments` - Get doctor's appointments

### Patients
- `GET /api/patients/me` - Get patient profile
- `GET /api/patients/me/appointments` - Get patient's appointments

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/me` - Get user's appointments
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/complete` - Complete appointment (doctor)
- `GET /api/appointments/available-slots` - Get available time slots

### Admin
- `GET /api/admin/doctors/pending` - Get pending doctors
- `PUT /api/admin/doctors/:id/approve` - Approve doctor
- `GET /api/admin/analytics` - Get analytics
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Delete user

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected routes with role-based access control
- Input validation with express-validator
- CORS configuration
- Secure cookie handling

## Development Notes

- The frontend uses Vite for fast development
- TypeScript is used throughout the frontend for type safety
- Tailwind CSS is used for styling
- The backend uses Express with MongoDB
- All API calls are made through Axios with interceptors for error handling

## Troubleshooting

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check the `MONGO_URI` in `.env` file

2. **Port Already in Use:**
   - Change the port in `server/.env` or `vite.config.ts`

3. **CORS Errors:**
   - Ensure the frontend URL matches the CORS configuration in `server.js`

4. **Build Errors:**
   - Delete `node_modules` and reinstall dependencies
   - Clear Vite cache: `rm -rf client/node_modules/.vite`

## License

ISC

## Contributing

Feel free to submit issues and enhancement requests!

