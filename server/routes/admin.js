const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

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

// @route   PUT /api/admin/doctors/:id/approve
// @desc    Approve a doctor
// @access  Private (Admin only)
router.put('/doctors/:id/approve', async (req, res) => {
  try {
    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password -refreshToken');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({ 
      message: 'Doctor approved successfully',
      doctor 
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Doctor not found' });
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
    // Get total counts
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ 
      role: 'doctor',
      isApproved: true 
    });
    const totalAppointments = await Appointment.countDocuments();
    
    // Get appointments per day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const appointmentsByDay = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
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
    ]);
    
    // Get appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get top 5 doctors by number of appointments
    const topDoctors = await Appointment.aggregate([
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
    ]);
    
    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      appointmentsByDay,
      appointmentsByStatus,
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
    const users = await User.find({ 
      role: { $in: ['patient', 'doctor'] } 
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
    await user.remove();
    
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
