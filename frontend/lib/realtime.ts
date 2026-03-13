import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type GameEventType =
  | 'player_join' | 'player_ready'
  | 'brew_start' | 'brew_complete' | 'ammo_dispatch'
  | 'build_start' | 'build_complete' | 'upgrade' | 'reposition' | 'reinforce'
  | 'weapon_fire' | 'weapon_assign' | 'weapon_repair' | 'weapon_durability'
  | 'enemy_spawn' | 'enemy_defeated' | 'lane_damage' | 'wave_start' | 'wave_end'
  | 'game_over'

export interface GameEvent {
  id: string
  room_code: string
  type: GameEventType
  payload: Record<string, unknown> | null
  created_at: string
}

export interface GameSession {
  id: string
  room_code: string
  team_name: string
  status: 'waiting' | 'playing' | 'complete'
  current_wave: number
  score: number
  waves_survived: number
  created_at: string
}

/** Subscribe to new game_events inserts for a room. Returns unsubscribe fn. */
export function subscribeToRoom(
  roomCode: string,
  onEvent: (event: GameEvent) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`room:${roomCode}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events',
        filter: `room_code=eq.${roomCode}`,
      },
      (payload) => onEvent(payload.new as GameEvent)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/** Insert a game event into the event bus. */
export async function publishEvent(
  roomCode: string,
  type: GameEventType,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase
    .from('game_events')
    .insert({ room_code: roomCode, type, payload })

  if (error) throw error
}

/** Fetch all historical game_events for a room in ascending order. */
export async function fetchRoomEvents(roomCode: string): Promise<GameEvent[]> {
  const { data, error } = await supabase
    .from('game_events')
    .select('id, room_code, type, payload, created_at')
    .eq('room_code', roomCode)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}
