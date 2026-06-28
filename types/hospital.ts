export interface Hospital {
  id: string
  name: string
  address: string
  city: string
  phone: string
  email: string | null
  rating: number
  total_reviews: number
  image_emoji: string
  opening_time: string
  closing_time: string
  is_active: boolean
  created_at: string
}

export interface QueueToken {
  id: string
  appointment_id: string
  hospital_id: string | null
  doctor_id: string | null
  token_number: number
  date: string
  status: 'waiting' | 'in_room' | 'completed' | 'skipped'
  called_at: string | null
  completed_at: string | null
  created_at: string
}

export interface FamilyMember {
  id: string
  user_id: string
  full_name: string
  age: number | null
  gender: string | null
  relationship: string
  phone: string | null
  created_at: string
}

export interface Payment {
  id: string
  appointment_id: string
  amount: number
  method: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash'
  status: 'pending' | 'paid' | 'refunded' | 'failed'
  transaction_id: string | null
  created_at: string
}
