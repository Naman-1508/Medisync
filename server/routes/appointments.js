const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('doctor', 'Doctor ID is required').not().isEmpty(),
      check('date', 'Please include a valid date').isISO8601(),
      check('startTime', 'Start time is required').not().isEmpty(),
      check('endTime', 'End time is required').not().isEmpty(),
      check('symptoms', 'Please include at least one symptom').isArray({ min: 1 })
    ]
  ],
  async (req, res) => {
    try {
      const { doctor, date, startTime, endTime, symptoms, notes } = req.body;
      
      // Check if doctor exists and is approved
      const doctorExists = await User.findOne({
        _id: doctor,
        role: 'doctor',
        isApproved: true
      });
      
      if (!doctorExists) {
        return res.status(400).json({ message: 'Doctor not found or not approved' });
      }
      
      // Check for existing appointment at the same time
      const existingAppointment = await Appointment.findOne({
        doctor,
        date,
        startTime,
        status: { $ne: 'cancelled' }
      });
      
      if (existingAppointment) {
        return res.status(400).json({ message: 'Time slot is already booked' });
      }
      
      // Create new appointment
      const appointment = new Appointment({
        patient: req.user.id,
        doctor,
        date,
        startTime,
        endTime,
        symptoms,
        notes: notes || '',
        status: 'scheduled'
      });
      
      await appointment.save();
      
      // Populate doctor and patient details
      await appointment.populate('doctor', 'name specialization');
      await appointment.populate('patient', 'name email');
      
      res.status(201).json(appointment);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/appointments/me
// @desc    Get current user's appointments
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    let appointments;
    
    if (req.user.role === 'patient') {
      appointments = await Appointment.find({ patient: req.user.id })
        .populate('doctor', 'name specialization')
        .sort({ date: -1, startTime: -1 });
    } else if (req.user.role === 'doctor') {
      appointments = await Appointment.find({ doctor: req.user.id })
        .populate('patient', 'name email phone')
        .sort({ date: 1, startTime: 1 });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel an appointment
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if the user is authorized to cancel this appointment
    if (appointment.patient.toString() !== req.user.id && 
        appointment.doctor.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to cancel this appointment' });
    }
    
    // Check if appointment can be cancelled (e.g., not in the past)
    const appointmentDateTime = new Date(
      `${appointment.date.toISOString().split('T')[0]}T${appointment.startTime}`
    );
    
    if (appointmentDateTime < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel past appointments' });
    }
    
    // Update appointment status
    appointment.status = 'cancelled';
    await appointment.save();
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/appointments/:id/complete
// @desc    Mark appointment as completed (Doctor only)
// @access  Private
router.put(
  '/:id/complete',
  [protect, authorize('doctor')],
  async (req, res) => {
    try {
      const { diagnosis, prescription } = req.body;
      
      const appointment = await Appointment.findById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Check if the doctor owns this appointment
      if (appointment.doctor.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      
      // Update appointment
      appointment.status = 'completed';
      appointment.diagnosis = diagnosis || '';
      appointment.prescription = prescription || '';
      
      await appointment.save();
      
      res.json(appointment);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/appointments/available-slots
// @desc    Get available time slots for a doctor on a specific date
// @access  Public
router.get('/available-slots', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and date are required' });
    }
    
    // Parse the date
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Get all appointments for the doctor on the selected date
    const appointments = await Appointment.find({
      doctor: doctorId,
      date: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
      },
      status: { $ne: 'cancelled' }
    });
    
    // Generate time slots (example: 9:00 AM to 5:00 PM, 1-hour slots)
    const timeSlots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime24 = `${hour.toString().padStart(2, '0')}:00`;
      const endHour24 = hour + 1;
      const endTime24 = `${endHour24.toString().padStart(2, '0')}:00`;
      
      // Format for display
      const startTimeDisplay = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
      const endTimeDisplay = `${endHour24 > 12 ? endHour24 - 12 : endHour24 === 0 ? 12 : endHour24}:00 ${endHour24 >= 12 ? 'PM' : 'AM'}`;
      
      // Check if this time slot is already booked
      const isBooked = appointments.some(apt => {
        return apt.startTime === startTime24 && apt.status !== 'cancelled';
      });
      
      timeSlots.push({
        time: startTimeDisplay,
        endTime: endTimeDisplay,
        startTime: startTime24,
        endTime24: endTime24,
        available: !isBooked
      });
    }
    
    res.json(timeSlots);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
