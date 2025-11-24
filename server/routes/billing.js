const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Billing = require('../models/Billing');

router.use(protect);

// @route   POST /api/billing
// @desc    Create a new bill
// @access  Private (Admin, Receptionist, Doctor)
router.post(
  '/',
  [
    authorize('admin', 'doctor', 'receptionist'),
    [
      check('patient', 'Patient ID is required').not().isEmpty(),
      check('items', 'At least one item is required').isArray({ min: 1 }),
      check('total', 'Total amount is required').isNumeric()
    ]
  ],
  async (req, res) => {
    try {
      const billing = new Billing(req.body);
      await billing.save();

      await billing.populate('patient', 'name email phone');
      await billing.populate('appointment', 'date');

      res.status(201).json(billing);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   GET /api/billing/me
// @desc    Get current user's bills
// @access  Private
router.get('/me', async (req, res) => {
  try {
    let bills;

    if (req.user.role === 'patient') {
      bills = await Billing.find({ patient: req.user.id })
        .populate('appointment', 'date')
        .sort({ createdAt: -1 });
    } else {
      bills = await Billing.find()
        .populate('patient', 'name email phone')
        .populate('appointment', 'date')
        .sort({ createdAt: -1 });
    }

    res.json(bills);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/billing/patient/:patientId
// @desc    Get all bills for a patient
// @access  Private
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'receptionist' && req.user.id !== patientId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const bills = await Billing.find({ patient: patientId })
      .populate('appointment', 'date')
      .sort({ createdAt: -1 });

    res.json(bills);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/billing/:id
// @desc    Get single bill
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('appointment', 'date');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (req.user.role !== 'admin' && 
        req.user.role !== 'receptionist' && 
        bill.patient._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(bill);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/billing/:id/payment
// @desc    Record payment
// @access  Private (Admin, Receptionist)
router.put(
  '/:id/payment',
  [
    authorize('admin', 'receptionist'),
    [
      check('amount', 'Payment amount is required').isNumeric(),
      check('method', 'Payment method is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    try {
      const bill = await Billing.findById(req.params.id);

      if (!bill) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      const { amount, method, transactionId } = req.body;

      bill.payments.push({
        amount,
        method,
        transactionId,
        paidAt: new Date()
      });

      const totalPaid = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);

      if (totalPaid >= bill.total) {
        bill.paymentStatus = 'paid';
        bill.paidAt = new Date();
      } else if (totalPaid > 0) {
        bill.paymentStatus = 'partial';
      }

      await bill.save();

      await bill.populate('patient', 'name email phone');
      await bill.populate('appointment', 'date');

      res.json(bill);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Bill not found' });
      }
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   PUT /api/billing/:id
// @desc    Update bill
// @access  Private (Admin, Receptionist)
router.put('/:id', [authorize('admin', 'receptionist')], async (req, res) => {
  try {
    const bill = await Billing.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('patient', 'name email phone')
      .populate('appointment', 'date');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
