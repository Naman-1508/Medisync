const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Billing = require('../models/Billing');

// Middleware to ensure only admins can access these routes
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/doctors/pending
// @desc    Get all pending doctor approvals
// @access  Private (Admin only)
router.get('/doctors/pending', async (req, res) => {
  try {
    const doctors = await User.find({ 
      role: 'doctor',
      isApproved: false 
    }).select('-password -refreshToken');
    
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const STAFF_APPROVABLE_ROLES = ['doctor', 'nurse', 'receptionist', 'pharmacist'];

async function approveUserById(userId) {
  const user = await User.findById(userId).select('-password -refreshToken');

  if (!user) {
    return { status: 404, message: 'User not found' };
  }

  if (!STAFF_APPROVABLE_ROLES.includes(user.role)) {
    return { status: 400, message: 'Only staff members require approval' };
  }

  if (user.isApproved) {
    return { status: 200, user, message: 'User already approved' };
  }

  user.isApproved = true;
  await user.save();
  return { status: 200, user, message: 'User approved successfully' };
}

// @route   PUT /api/admin/doctors/:id/approve
// @desc    Approve a doctor (legacy route)
// @access  Private (Admin only)
router.put('/doctors/:id/approve', async (req, res) => {
  try {
    const result = await approveUserById(req.params.id);
    if (!result.user) {
      return res.status(result.status).json({ message: result.message });
    }
    res.json({ message: result.message, user: result.user });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/users/:id/approve
// @desc    Approve a staff member (doctor, nurse, receptionist, pharmacist)
// @access  Private (Admin only)
router.put('/users/:id/approve', async (req, res) => {
  try {
    const result = await approveUserById(req.params.id);
    if (!result.user) {
      return res.status(result.status).json({ message: result.message });
    }
    res.json({ message: result.message, user: result.user });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/doctors/:id
// @desc    Delete a doctor
// @access  Private (Admin only)
router.delete('/doctors/:id', async (req, res) => {
  try {
    const doctor = await User.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Also delete all appointments associated with this doctor
    await Appointment.deleteMany({ doctor: req.params.id });

    res.json({ message: 'Doctor and associated appointments removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private (Admin only)
router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date(endOfDay);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalPatients,
      totalDoctors,
      pendingApprovals,
      totalAppointments,
      todaysAppointments,
      appointmentsByDayRaw,
      appointmentsByStatusRaw,
      topDoctors,
      revenueTrendRaw,
      revenueBreakdownRaw,
      userDistribution
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor', isApproved: true }),
      User.countDocuments({ role: 'doctor', isApproved: false }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Appointment.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo, $lte: endOfDay },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Appointment.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$status', 'unspecified'] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Appointment.aggregate([
        {
          $match: { status: { $ne: 'cancelled' } }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'doctor',
            foreignField: '_id',
            as: 'doctorInfo'
          }
        },
        { $unwind: '$doctorInfo' },
        {
          $group: {
            _id: '$doctor',
            name: { $first: '$doctorInfo.name' },
            specialization: { $first: '$doctorInfo.specialization' },
            appointmentCount: { $sum: 1 }
          }
        },
        { $sort: { appointmentCount: -1 } },
        { $limit: 5 }
      ]),
      Billing.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            paymentStatus: { $ne: 'refunded' }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$total' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Billing.aggregate([
        {
          $match: {
            paymentStatus: { $ne: 'refunded' }
          }
        },
        {
          $group: {
            _id: { $ifNull: ['$paymentStatus', 'unspecified'] },
            total: { $sum: '$total' }
          }
        },
        { $sort: { total: -1 } }
      ]),
      User.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$role', 'unspecified'] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    const appointmentsByDay = appointmentsByDayRaw || [];
    const appointmentsByStatus = appointmentsByStatusRaw || [];
    const revenueTrend = revenueTrendRaw || [];
    const revenueBreakdown = revenueBreakdownRaw || [];
    const revenue = revenueTrend.reduce((sum, entry) => sum + (entry.total || 0), 0);

    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      todaysAppointments,
      pendingApprovals,
      revenue,
      appointmentsByDay,
      appointmentsByStatus,
      revenueTrend,
      revenueBreakdown,
      userDistribution: userDistribution || [],
      topDoctors
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (patients and doctors)
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const managedRoles = ['patient', 'doctor', 'nurse', 'receptionist', 'pharmacist'];
    const users = await User.find({ 
      role: { $in: managedRoles } 
    }).select('-password -refreshToken')
      .sort({ role: 1, name: 1 });
    
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (patient or doctor)
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user is a doctor, delete their appointments
    if (user.role === 'doctor') {
      await Appointment.deleteMany({ doctor: req.params.id });
    } else {
      // If user is a patient, delete their appointments
      await Appointment.deleteMany({ patient: req.params.id });
    }
    
    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'User and associated data removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
