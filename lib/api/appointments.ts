import { supabase } from '../supabase'
import { Appointment, AppointmentWithDetails } from '../../types'

interface CreateAppointmentParams {
  patient_id: string
  hospital_id: string
  doctor_id: string
  doctor_slot_id: string
  date: string
  start_time: string
  end_time: string
  patient_name: string
  patient_age: number
  patient_gender: string
  patient_phone: string
  reason: string
  notes?: string
}

export async function createAppointment(params: CreateAppointmentParams): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...params,
      appointment_type: 'doctor',
      status: 'confirmed',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createQueueToken(params: {
  appointment_id: string
  hospital_id: string
  doctor_id: string
  date: string
}): Promise<number> {
  // Get next token number
  const { data: tokenNum, error: fnError } = await supabase
    .rpc('get_next_token', { p_doctor_id: params.doctor_id, p_date: params.date })

  if (fnError) throw fnError

  const { data, error } = await supabase
    .from('queue_tokens')
    .insert({
      ...params,
      token_number: tokenNum,
      status: 'waiting',
    })
    .select('token_number')
    .single()

  if (error) throw error
  return data.token_number
}

export async function getPatientAppointments(patientId: string): Promise<AppointmentWithDetails[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      hospitals (id, name, address),
      doctors (id, full_name, specialization, consultation_fee, avatar_emoji)
    `)
    .eq('patient_id', patientId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data ?? []) as AppointmentWithDetails[]
}

export async function getAppointmentWithQueue(appointmentId: string) {
  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .select(`
      *,
      hospitals (id, name, address),
      doctors (id, full_name, specialization, room_number)
    `)
    .eq('id', appointmentId)
    .single()

  if (apptError) throw apptError

  const { data: token, error: tokenError } = await supabase
    .from('queue_tokens')
    .select('*')
    .eq('appointment_id', appointmentId)
    .single()

  if (tokenError) throw tokenError

  return { appointment: appt, token }
}

export async function getDoctorAppointments(doctorId: string, date: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      profiles!patient_id (full_name, phone)
    `)
    .eq('doctor_id', doctorId)
    .eq('date', date)
    .order('start_time')

  if (error) throw error
  return data ?? []
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)

  if (error) throw error
}
