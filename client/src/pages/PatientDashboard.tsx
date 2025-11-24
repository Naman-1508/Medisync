import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { appointmentsApi, doctorsApi } from '../utils/api'
import { Appointment, User, TimeSlot } from '../types'
import { Calendar, Clock, User as UserIcon, LogOut, Plus, X, FileText, Pill, Check } from 'lucide-react'
import Button from '../components/ui/Button'
import Card, { CardHeader, CardContent } from '../components/ui/Card'
import { format } from 'date-fns'

export default function PatientDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<User[]>([])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([''])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAppointments()
    fetchDoctors()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsApi.getMine()
      setAppointments(response.data)
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await doctorsApi.getAll()
      setDoctors(response.data)
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
    }
  }

  const handleDateChange = async (doctorId: string, date: string) => {
    setSelectedDate(date)
    try {
      const response = await appointmentsApi.getAvailableSlots(doctorId, date)
      setAvailableSlots(response.data)
    } catch (error) {
      console.error('Failed to fetch available slots:', error)
    }
  }

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const slot = availableSlots.find(s => `${s.time} - ${s.endTime}` === selectedSlot)
      if (!slot || !slot.available) {
        toast.error('Selected time slot is no longer available')
        setLoading(false)
        return
      }
      
      await appointmentsApi.create({
        doctor: selectedDoctor._id,
        date: selectedDate,
        startTime: slot.startTime || slot.time.split(' ')[0],
        endTime: slot.endTime24 || slot.endTime.split(' ')[0],
        symptoms: symptoms.filter(s => s.trim()),
        notes
      })
      toast.success('Appointment booked successfully!')
      setShowBookingModal(false)
      fetchAppointments()
      // Reset form
      setSelectedDoctor(null)
      setSelectedDate('')
      setSelectedSlot('')
      setSymptoms([''])
      setNotes('')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      await appointmentsApi.cancel(id)
      toast.success('Appointment cancelled')
      fetchAppointments()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const addSymptom = () => {
    setSymptoms([...symptoms, ''])
  }

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index))
  }

  const updateSymptom = (index: number, value: string) => {
    const newSymptoms = [...symptoms]
    newSymptoms[index] = value
    setSymptoms(newSymptoms)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
        </div>
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Button
            onClick={() => setShowBookingModal(true)}
            className="w-full"
          >
            <Plus className="h-5 w-5 mr-2" />
            Book Appointment
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/doctors')}
            className="w-full"
          >
            <UserIcon className="h-5 w-5 mr-2" />
            Browse Doctors
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/medical-records')}
            className="w-full"
          >
            <FileText className="h-5 w-5 mr-2" />
            Medical Records
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/prescriptions')}
            className="w-full"
          >
            <Pill className="h-5 w-5 mr-2" />
            Prescriptions
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-primary-600">
                  {appointments.filter(a => a.status === 'scheduled' && new Date(a.date) >= new Date()).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">My Appointments</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {appointments.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No appointments yet. Book your first appointment!</p>
              </div>
            ) : (
              appointments.map((apt) => {
                const doctor = typeof apt.doctor === 'object' ? apt.doctor : null
                return (
                  <div key={apt._id} className="py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <UserIcon className="h-5 w-5 text-primary-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Dr. {doctor?.name || 'Unknown'}
                          </h3>
                          {doctor?.specialization && (
                            <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                              {doctor.specialization}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 ml-8">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(apt.date), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{apt.startTime} - {apt.endTime}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            apt.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                            apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        {apt.symptoms && apt.symptoms.length > 0 && (
                          <div className="mt-2 ml-8">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Symptoms:</span> {apt.symptoms.join(', ')}
                            </p>
                          </div>
                        )}
                        {apt.diagnosis && (
                          <div className="mt-2 ml-8">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Diagnosis:</span> {apt.diagnosis}
                            </p>
                          </div>
                        )}
                      </div>
                      {apt.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelAppointment(apt._id)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                <select
                  value={selectedDoctor?._id || ''}
                  onChange={(e) => {
                    const doctor = doctors.find(d => d._id === e.target.value)
                    setSelectedDoctor(doctor || null)
                    setSelectedDate('')
                    setSelectedSlot('')
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.name} {doctor.specialization && `- ${doctor.specialization}`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDoctor && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(selectedDoctor._id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {selectedDate && availableSlots.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedSlot(`${slot.time} - ${slot.endTime}`)}
                            disabled={!slot.available}
                            className={`px-4 py-2 rounded-lg border transition ${
                              selectedSlot === `${slot.time} - ${slot.endTime}`
                                ? 'bg-primary-600 text-white border-primary-600'
                                : slot.available
                                ? 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
                    {symptoms.map((symptom, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={symptom}
                          onChange={(e) => updateSymptom(index, e.target.value)}
                          placeholder="Enter symptom"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                        {symptoms.length > 1 && (
                          <button
                            onClick={() => removeSymptom(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addSymptom}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      + Add Symptom
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Any additional information..."
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookAppointment}
                  disabled={loading || !selectedDoctor || !selectedDate || !selectedSlot}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

