// server/models/Patient.js
const mongoose = require('mongoose');
const User = require('./User');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    required: [true, 'Gender is required']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
    default: null
  },
  height: {
    value: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['cm', 'feet'],
      default: 'cm'
    }
  },
  weight: {
    value: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    }
  },
  allergies: [{
    name: {
      type: String,
      required: [true, 'Allergy name is required']
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'moderate'
    },
    notes: String
  }],
  medications: [{
    name: {
      type: String,
      required: [true, 'Medication name is required']
    },
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  medicalConditions: [{
    name: {
      type: String,
      required: [true, 'Condition name is required']
    },
    diagnosisDate: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'resolved', 'chronic'],
      default: 'active'
    },
    notes: String
  }],
  emergencyContacts: [{
    name: {
      type: String,
      required: [true, 'Contact name is required']
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    email: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    validUntil: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full address
patientSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.postalCode}, ${this.address.country}`.trim();
});

// Virtual for age
patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Update user's role to 'patient' when a patient profile is created
patientSchema.pre('save', async function(next) {
  if (this.isNew) {
    await User.findByIdAndUpdate(this.user, { role: 'patient' });
  }
  next();
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;