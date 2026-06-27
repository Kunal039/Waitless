export type UserRole = 'patient' | 'doctor' | 'lab_admin'

export interface UserProfile {
  id: string
  email: string | null
  phone: string | null
  full_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}
