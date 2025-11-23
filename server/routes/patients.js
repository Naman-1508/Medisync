const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// @route   GET /api/patients/me
// @desc    Get current patient profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const patient = await User.findById(req.user.id)
      .select('-password -refreshToken');

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/patients/me
// @desc    Update patient profile
// @access  Private
router.put(
  '/me',
  [
    protect,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('phone', 'Phone number is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    try {
      const { name, email, phone, address, dateOfBirth } = req.body;

      const patientFields = {
        name,
        email,
        phone,
        address,
        dateOfBirth
      };

      const patient = await User.findByIdAndUpdate(
        req.user.id,
        { $set: patientFields },
        { new: true, runValidators: true }
      ).select('-password -refreshToken');

      res.json(patient);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/patients/me/appointments
// @desc    Get patient's appointments
// @access  Private
router.get('/me/appointments', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialization')
      .sort({ date: -1, startTime: -1 });

    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/patients/me/appointments/upcoming
// @desc    Get patient's upcoming appointments
// @access  Private
router.get('/me/appointments/upcoming', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      patient: req.user.id,
      date: { $gte: today },
      status: 'scheduled'
    })
      .populate('doctor', 'name specialization')
      .sort({ date: 1, startTime: 1 });

    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/patients/me/appointments/past
// @desc    Get patient's past appointments
// @access  Private
router.get('/me/appointments/past', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      patient: req.user.id,
      $or: [
        { date: { $lt: today } },
        { 
          date: today,
          endTime: { $lt: new Date().toTimeString().substring(0, 5) }
        },
        { status: { $in: ['completed', 'cancelled'] } }
      ]
    })
      .populate('doctor', 'name specialization')
      .sort({ date: -1, startTime: -1 })
      .limit(10);

    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/patients/me/medical-history
// @desc    Get patient's medical history
// @access  Private
router.get('/me/medical-history', protect, async (req, res) => {
  try {
    const medicalHistory = await Appointment.find({
      patient: req.user.id,
      status: 'completed'
    })
      .select('date symptoms diagnosis prescription')
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });

    res.json(medicalHistory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/patients/me/update-password
// @desc    Update patient's password
// @access  Private
router.post(
  '/me/update-password',
  [
    protect,
    [
      check('currentPassword', 'Current password is required').exists(),
      check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ]
  ],
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const patient = await User.findById(req.user.id).select('+password');

      // Check current password
      const isMatch = await patient.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password
      patient.password = newPassword;
      await patient.save();

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;