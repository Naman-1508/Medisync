# 🚀 Quick Start Guide - MediSync

## For Your Presentation Tomorrow!

### Step 1: Install Dependencies
```bash
npm run install-all
```

### Step 2: Create Environment File
Create `server/.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/medisync
JWT_SECRET=medisync-secret-key-2024
JWT_REFRESH_SECRET=medisync-refresh-secret-2024
JWT_EXPIRE=30m
COOKIE_NAME=token
```

### Step 3: Create Admin User
```bash
cd server
npm run create-admin
```

### Step 4: Start the Application
```bash
npm run dev
```

This will start:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## 🔑 Login Credentials

### Admin Account
- **Email:** `admin@medisync.com`
- **Password:** `admin123`

### Test Accounts (Create via Register)
- Register as **Patient** to test patient features
- Register as **Doctor** to test doctor features (needs admin approval)

## 📋 Features to Demo

### Admin Dashboard
1. Login as admin
2. View analytics with charts
3. Approve pending doctors
4. View all users
5. See appointment statistics

### Patient Features
1. Register/Login as patient
2. Browse doctors
3. Book appointments
4. View medical records
5. View prescriptions
6. View billing

### Doctor Features
1. Register as doctor (wait for admin approval)
2. View appointments
3. Complete appointments
4. Create medical records
5. Create prescriptions

## 🎯 Key Pages to Show

1. **Home Page** (`/`) - Landing page
2. **Admin Dashboard** (`/admin/dashboard`) - Analytics & charts
3. **Patient Dashboard** (`/patient/dashboard`) - Appointment booking
4. **Doctor Dashboard** (`/doctor/dashboard`) - Appointment management
5. **Medical Records** (`/medical-records`) - View records
6. **Prescriptions** (`/prescriptions`) - View prescriptions
7. **Billing** (`/billing`) - View invoices

## ⚠️ Important Notes

1. **MongoDB must be running** - Make sure MongoDB is installed and running
2. **First time setup** - Run `npm run create-admin` to create admin user
3. **Doctor approval** - Doctors need admin approval before they can login
4. **Port conflicts** - If ports 5000 or 5173 are in use, change them in config files

## 🐛 Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `mongod` or start MongoDB service
- Check MONGO_URI in `.env` file

### Port Already in Use
- Change PORT in `server/.env`
- Change port in `client/vite.config.ts`

### Build Errors
- Delete `node_modules` and reinstall: `npm run install-all`
- Clear cache: `rm -rf client/node_modules/.vite`

## ✨ What's Working

✅ Complete authentication system
✅ Role-based access control
✅ Admin dashboard with charts
✅ Patient appointment booking
✅ Doctor appointment management
✅ Medical records viewing
✅ Prescriptions viewing
✅ Billing system
✅ Notifications
✅ Responsive design
✅ Modern UI with Tailwind CSS

## 🎨 UI Highlights

- Clean, modern design
- Responsive on all devices
- Real-time notifications
- Interactive charts and analytics
- Professional color scheme
- Smooth animations

Good luck with your presentation! 🎉

