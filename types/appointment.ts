export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type AppointmentType = 'doctor' | 'lab'

export interface Appointment {
  id: string
  patient_id: string
  appointment_type: AppointmentType
  status: AppointmentStatus
  date: string         // YYYY-MM-DD
  start_time: string   // HH:MM
  end_time: string     // HH:MM
  notes: string | null
  created_at: string

  // doctor appointment fields
  doctor_id: string | null
  doctor_slot_id: string | null

  // lab appointment fields
  lab_id: string | null
  lab_slot_id: string | null
  lab_test_id: string | null
}

export interface AppointmentWithDetails extends Appointment {
  patient?: {
    full_name: string
    phone: string | null
    email: string | null
  }
  doctor?: {
    full_name: string
    specialization: string
    consultation_fee: number
  }
  lab?: {
    name: string
    address: string
    phone: string
  }
  lab_test?: {
    name: string
    price: number
  }
}
