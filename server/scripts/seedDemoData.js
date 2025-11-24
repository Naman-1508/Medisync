/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Billing = require('../models/Billing');
const Department = require('../models/Department');

async function ensureUser(payload) {
  let user = await User.findOne({ email: payload.email });
  if (user) {
    return user;
  }
  user = new User(payload);
  await user.save();
  return user;
}

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in your environment');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const generalMedicine = await Department.findOneAndUpdate(
      { name: 'General Medicine' },
      { name: 'General Medicine', description: 'Primary care and internal medicine' },
      { upsert: true, new: true }
    );

    const admin = await ensureUser({
      name: 'System Admin',
      email: 'admin@medisync.com',
      password: 'Admin@123',
      role: 'admin',
      isApproved: true
    });

    const doctor = await ensureUser({
      name: 'Dr. Emily Carter',
      email: 'doctor@medisync.com',
      password: 'Doctor@123',
      role: 'doctor',
      department: generalMedicine._id,
      specialization: 'Internal Medicine',
      experience: 8,
      consultationFee: 120,
      isApproved: true
    });

    const patient = await ensureUser({
      name: 'John Doe',
      email: 'patient@medisync.com',
      password: 'Patient@123',
      role: 'patient',
      phone: '+1 (555) 100-1100',
      isApproved: true
    });

    const nurse = await ensureUser({
      name: 'Nurse Olivia',
      email: 'nurse@medisync.com',
      password: 'Nurse@123',
      role: 'nurse',
      isApproved: true
    });

    const receptionist = await ensureUser({
      name: 'Receptionist Ryan',
      email: 'reception@medisync.com',
      password: 'Reception@123',
      role: 'receptionist',
      isApproved: true
    });

    const pharmacist = await ensureUser({
      name: 'Pharmacist Priya',
      email: 'pharmacist@medisync.com',
      password: 'Pharmacist@123',
      role: 'pharmacist',
      isApproved: true
    });

    const appointment = await Appointment.findOneAndUpdate(
      { patient: patient._id, doctor: doctor._id, date: { $gte: new Date(Date.now() - 86400000) } },
      {
        patient: patient._id,
        doctor: doctor._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '10:30',
        status: 'scheduled',
        notes: 'Routine health check',
        symptoms: ['Fatigue']
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const subtotal = 120;
    const tax = 12;
    const total = subtotal + tax;

    await Billing.findOneAndUpdate(
      { appointment: appointment._id },
      {
        patient: patient._id,
        appointment: appointment._id,
        invoiceNumber: `INV-DEMO-${Date.now()}`,
        items: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: subtotal,
            total: subtotal,
            category: 'consultation'
          }
        ],
        subtotal,
        tax,
        discount: 0,
        total,
        paymentStatus: 'pending'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Seed data created successfully!');
    console.log('Login accounts:');
    console.log(` Admin        -> ${admin.email} / Admin@123`);
    console.log(` Doctor       -> ${doctor.email} / Doctor@123`);
    console.log(` Patient      -> ${patient.email} / Patient@123`);
    console.log(` Nurse        -> ${nurse.email} / Nurse@123`);
    console.log(` Receptionist -> ${receptionist.email} / Reception@123`);
    console.log(` Pharmacist   -> ${pharmacist.email} / Pharmacist@123`);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();

