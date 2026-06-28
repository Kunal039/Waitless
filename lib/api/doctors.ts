import { supabase } from '../supabase'
import { Doctor, DoctorSlot } from '../../types'

export async function getDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('hospital_id', hospitalId)
    .eq('is_available', true)
    .order('full_name')

  if (error) throw error
  return data ?? []
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getDoctorByUserId(userId: string): Promise<Doctor | null> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data
}

export async function getDoctorSlots(doctorId: string, date: string): Promise<DoctorSlot[]> {
  const { data, error } = await supabase
    .from('doctor_slots')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('date', date)
    .order('start_time')

  if (error) throw error
  return data ?? []
}

export async function markSlotBooked(slotId: string): Promise<void> {
  const { error } = await supabase
    .from('doctor_slots')
    .update({ is_booked: true })
    .eq('id', slotId)

  if (error) throw error
}

export async function searchDoctors(query: string): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .or(`full_name.ilike.%${query}%,specialization.ilike.%${query}%`)
    .eq('is_available', true)

  if (error) throw error
  return data ?? []
}
