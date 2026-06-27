export interface Lab {
  id: string
  user_id: string
  name: string
  address: string
  city: string
  phone: string
  email: string | null
  opening_time: string  // HH:MM
  closing_time: string  // HH:MM
  is_active: boolean
  created_at: string
}

export interface LabTest {
  id: string
  lab_id: string
  name: string
  description: string | null
  price: number
  preparation_info: string | null
  result_time_hours: number
  is_available: boolean
}

export interface LabSlot {
  id: string
  lab_id: string
  date: string        // YYYY-MM-DD
  start_time: string  // HH:MM
  end_time: string    // HH:MM
  capacity: number
  booked_count: number
  created_at: string
}
