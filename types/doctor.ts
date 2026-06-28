export interface Doctor {
  id: string
  user_id: string | null
  hospital_id: string | null
  full_name: string
  specialization: string
  qualification: string
  experience_years: number
  bio: string | null
  avatar_emoji: string
  consultation_fee: number
  is_available: boolean
  room_number: string | null
  shift_start: string | null
  shift_end: string | null
  created_at: string
}

export interface DoctorSlot {
  id: string
  doctor_id: string
  date: string         // YYYY-MM-DD
  start_time: string   // HH:MM
  end_time: string     // HH:MM
  is_booked: boolean
  created_at: string
}
