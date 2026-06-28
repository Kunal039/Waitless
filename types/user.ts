export type UserRole = 'patient' | 'doctor' | 'lab_admin' | 'reception' | 'admin'

export interface UserProfile {
  id: string
  email: string | null
  phone: string | null
  full_name: string
  role: UserRole
  avatar_url: string | null
  age: number | null
  gender: string | null
  city: string | null
  created_at: string
}

export interface FamilyMember {
  id: string
  user_id: string
  full_name: string
  age: number
  gender: string
  relationship: string
  phone: string | null
  created_at?: string
}
