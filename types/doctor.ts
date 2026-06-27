export interface Doctor {
  id: string
  user_id: string
  full_name: string
  specialization: string
  qualification: string
  experience_years: number
  bio: string | null
  avatar_url: string | null
  consultation_fee: number
  is_available: boolean
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
