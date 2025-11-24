const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Prescription = require('../models/Prescription');

router.use(protect);

// @route   POST /api/prescriptions
// @desc    Create a new prescription
// @access  Private (Doctor only)
router.post(
  '/',
  [
    authorize('doctor', 'admin'),
    [
      check('patient', 'Patient ID is required').not().isEmpty(),
      check('medications', 'At least one medication is required').isArray({ min: 1 })
    ]
  ],
  async (req, res) => {
    try {
      const prescriptionData = {
        ...req.body,
        doctor: req.user.id
      };

      const prescription = new Prescription(prescriptionData);
      await prescription.save();

      await prescription.populate('patient', 'name email phone');
      await prescription.populate('doctor', 'name specialization');

      res.status(201).json(prescription);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   GET /api/prescriptions/me
// @desc    Get current user's prescriptions
// @access  Private
router.get('/me', async (req, res) => {
  try {
    let prescriptions;

    if (req.user.role === 'patient') {
      prescriptions = await Prescription.find({ patient: req.user.id })
        .populate('doctor', 'name specialization')
        .populate('appointment', 'date')
        .sort({ issuedDate: -1 });
    } else if (req.user.role === 'doctor') {
      prescriptions = await Prescription.find({ doctor: req.user.id })
        .populate('patient', 'name email phone')
        .populate('appointment', 'date')
        .sort({ issuedDate: -1 });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    res.json(prescriptions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/prescriptions/patient/:patientId
// @desc    Get all prescriptions for a patient
// @access  Private
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'doctor' && req.user.id !== patientId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'date')
      .sort({ issuedDate: -1 });

    res.json(prescriptions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/prescriptions/:id
// @desc    Get single prescription
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'date');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (req.user.role !== 'admin' && 
        req.user.role !== 'doctor' && 
        prescription.patient._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(prescription);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/prescriptions/:id
// @desc    Update prescription
// @access  Private (Doctor or Admin only)
router.put('/:id', [authorize('doctor', 'admin')], async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (req.user.role !== 'admin' && prescription.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization');

    res.json(updatedPrescription);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
