const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
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
  medicalRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  },
  medications: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'days'
      }
    },
    instructions: String,
    quantity: Number,
    beforeMeal: {
      type: Boolean,
      default: false
    },
    afterMeal: {
      type: Boolean,
      default: false
    }
  }],
  instructions: String,
  issuedDate: {
    type: Date,
    default: Date.now
  },
  validUntil: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  pharmacy: {
    name: String,
    address: String,
    phone: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

prescriptionSchema.index({ patient: 1, issuedDate: -1 });
prescriptionSchema.index({ doctor: 1, issuedDate: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
