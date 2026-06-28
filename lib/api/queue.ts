import { supabase } from '../supabase'
import { QueueToken } from '../../types'

export async function getLiveQueue(doctorId: string, date: string): Promise<QueueToken[]> {
  const { data, error } = await supabase
    .from('queue_tokens')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('date', date)
    .in('status', ['waiting', 'in_room'])
    .order('token_number')

  if (error) throw error
  return data ?? []
}

export async function getCurrentToken(doctorId: string, date: string): Promise<QueueToken | null> {
  const { data, error } = await supabase
    .from('queue_tokens')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('date', date)
    .eq('status', 'in_room')
    .maybeSingle()

  if (error) return null
  return data
}

export async function callNextToken(doctorId: string, date: string): Promise<void> {
  // Complete current in_room token
  await supabase
    .from('queue_tokens')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('doctor_id', doctorId)
    .eq('date', date)
    .eq('status', 'in_room')

  // Call next waiting token
  const { data: next } = await supabase
    .from('queue_tokens')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('date', date)
    .eq('status', 'waiting')
    .order('token_number')
    .limit(1)
    .single()

  if (next) {
    await supabase
      .from('queue_tokens')
      .update({ status: 'in_room', called_at: new Date().toISOString() })
      .eq('id', next.id)

    // Update corresponding appointment
    const { data: token } = await supabase
      .from('queue_tokens')
      .select('appointment_id')
      .eq('id', next.id)
      .single()

    if (token) {
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', token.appointment_id)
    }
  }
}

export function subscribeToQueue(
  doctorId: string,
  date: string,
  onUpdate: (tokens: QueueToken[]) => void
) {
  const channel = supabase
    .channel(`queue:${doctorId}:${date}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_tokens',
        filter: `doctor_id=eq.${doctorId}`,
      },
      async () => {
        const tokens = await getLiveQueue(doctorId, date)
        onUpdate(tokens)
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
