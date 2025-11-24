const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  testName: {
    type: String,
    required: true
  },
  testType: {
    type: String,
    enum: ['blood', 'urine', 'imaging', 'biopsy', 'culture', 'other'],
    required: true
  },
  orderedDate: {
    type: Date,
    default: Date.now
  },
  scheduledDate: Date,
  completedDate: Date,
  status: {
    type: String,
    enum: ['ordered', 'scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'ordered'
  },
  results: [{
    parameter: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    unit: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['normal', 'abnormal', 'critical'],
      default: 'normal'
    }
  }],
  labTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  reportUrl: String,
  cost: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

labTestSchema.index({ patient: 1, orderedDate: -1 });
labTestSchema.index({ doctor: 1, orderedDate: -1 });
labTestSchema.index({ status: 1 });

module.exports = mongoose.model('LabTest', labTestSchema);



