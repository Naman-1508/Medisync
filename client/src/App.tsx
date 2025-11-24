import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import Header from './components/layout/Header'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import StaffDashboard from './pages/StaffDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminUsers from './pages/AdminUsers'
import Home from './pages/Home'
import MedicalRecords from './pages/MedicalRecords'
import Prescriptions from './pages/Prescriptions'
import Billing from './pages/Billing'
import Departments from './pages/Departments'
import Profile from './pages/Profile'
import Doctors from './pages/Doctors'
import Appointments from './pages/Appointments'

const STAFF_ROLES = ['nurse', 'receptionist', 'pharmacist'] as const

interface PrivateRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Register />} />
      <Route
        path="/patient/dashboard"
        element={
          <PrivateRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/doctor/dashboard"
        element={
          <PrivateRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </PrivateRoute>
        }
      />
      {STAFF_ROLES.map(role => (
        <Route
          key={role}
          path={`/${role}/dashboard`}
          element={
            <PrivateRoute allowedRoles={[role]}>
              <StaffDashboard />
            </PrivateRoute>
          }
        />
      ))}
      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminAnalytics />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminUsers />
          </PrivateRoute>
        }
      />
      <Route
        path="/medical-records"
        element={
          <PrivateRoute>
            <MedicalRecords />
          </PrivateRoute>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <PrivateRoute>
            <Prescriptions />
          </PrivateRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <PrivateRoute>
            <Billing />
          </PrivateRoute>
        }
      />
      <Route
        path="/departments"
        element={<Departments />}
      />
      <Route
        path="/doctors"
        element={<Doctors />}
      />
      <Route
        path="/appointments"
        element={
          <PrivateRoute>
            <Appointments />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <AppRoutes />
          </div>
          <ToastContainer position="top-right" autoClose={3000} />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App

