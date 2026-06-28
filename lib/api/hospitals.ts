import { supabase } from '../supabase'
import { Hospital } from '../../types'

export async function getHospitals(city?: string): Promise<Hospital[]> {
  let query = supabase
    .from('hospitals')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false })

  if (city) {
    query = query.ilike('city', `%${city}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function searchHospitals(query: string): Promise<Hospital[]> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
    .order('rating', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getHospitalById(id: string): Promise<Hospital | null> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
