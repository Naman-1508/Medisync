const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    institution: String,
    year: Number
  }],
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  consultationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  availableDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  availableHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '17:00'
    }
  },
  languages: [{
    type: String
  }],
  hospital: {
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalPatients: {
    type: Number,
    default: 0
  },
  totalAppointments: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update user's role when doctor profile is created
doctorSchema.pre('save', async function(next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.user, { 
      role: 'doctor',
      specialization: this.specialization
    });
  }
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);



