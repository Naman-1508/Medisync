const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

// Simple department schema (can be expanded)
const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

// @route   GET /api/departments
// @desc    Get all departments
// @access  Public
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('head', 'name specialization')
      .sort({ name: 1 });

    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/departments
// @desc    Create department
// @access  Private (Admin only)
router.post(
  '/',
  [
    protect,
    authorize('admin'),
    [
      check('name', 'Department name is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    try {
      const department = new Department(req.body);
      await department.save();

      await department.populate('head', 'name specialization');
      res.status(201).json(department);
    } catch (err) {
      console.error(err.message);
      if (err.code === 11000) {
        return res.status(400).json({ message: 'Department already exists' });
      }
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   GET /api/departments/:id
// @desc    Get single department
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head', 'name specialization');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(department);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
