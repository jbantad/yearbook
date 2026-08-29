import { supabase } from './supabase'

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export async function findPriorPageDates(userId: string, beforeDateISO: string, limit: number): Promise<string[]> {
  const { data } = await supabase
    .from('pages')
    .select('page_date')
    .eq('user_id', userId)
    .eq('kind', 'day')
    .lt('page_date', beforeDateISO)
    .order('page_date', { ascending: false })
    .limit(limit)
  return (data ?? []).map((p) => p.page_date as string)
}

export async function getOrCreateDayPage(userId: string, dateISO: string) {
  const { data: existing } = await supabase
    .from('pages')
    .select('id')
    .eq('user_id', userId)
    .eq('kind', 'day')
    .eq('page_date', dateISO)
    .maybeSingle()
  if (existing) return existing.id
  const { data: created, error } = await supabase
    .from('pages')
    .insert({ user_id: userId, kind: 'day', page_date: dateISO })
    .select('id')
    .single()
  if (error) throw error
  return created.id
}
