import { supabase } from './supabase'
import { UserRole } from '../types'

export async function signInWithPhone(phone: string) {
  return supabase.auth.signInWithOtp({ phone })
}

export async function verifyOtp(phone: string, token: string) {
  return supabase.auth.verifyOtp({ phone, token, type: 'sms' })
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
}

export async function createUserProfile(userId: string, fullName: string, role: UserRole, phone?: string, email?: string) {
  return supabase
    .from('profiles')
    .insert({ id: userId, full_name: fullName, role, phone, email })
}
