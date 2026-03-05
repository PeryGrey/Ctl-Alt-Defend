'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { subscribeToRoom, publishEvent, type GameEvent } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { Button } from '@/_shadcn/components/ui/button'
import { Badge } from '@/_shadcn/components/ui/badge'
import { Card, CardContent } from '@/_shadcn/components/ui/card'

type Role = 'builder' | 'artillery' | 'alchemist'

const ROLE_META: Record<Role, { label: string; emoji: string }> = {
  builder:   { label: 'Builder',   emoji: '🏗️' },
  artillery: { label: 'Artillery', emoji: '🎯' },
  alchemist: { label: 'Alchemist', emoji: '⚗️' },
}

const ALL_ROLES: Role[] = ['builder', 'artillery', 'alchemist']

export default function LobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const myRole = searchParams.get('role') as Role | null
  const [joined, setJoined] = useState<Set<Role>>(new Set())
  const [teamName, setTeamName] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    async function load() {
      const [sessionRes, eventsRes] = await Promise.all([
        supabase.from('game_sessions').select('team_name').eq('room_code', roomCode).single(),
        supabase
          .from('game_events')
          .select('payload')
          .eq('room_code', roomCode)
          .eq('type', 'player_join'),
      ])
      if (sessionRes.data) setTeamName(sessionRes.data.team_name)
      if (eventsRes.data) {
        const roles = eventsRes.data
          .map(e => (e.payload as { role?: string } | null)?.role)
          .filter((r): r is Role => ALL_ROLES.includes(r as Role))
        setJoined(new Set(roles))
      }
    }
    void load()
  }, [roomCode])

  useEffect(() => {
    const unsub = subscribeToRoom(roomCode, (event: GameEvent) => {
      if (event.type === 'player_join') {
        const role = (event.payload as { role?: string } | null)?.role
        if (role && ALL_ROLES.includes(role as Role)) {
          setJoined(prev => new Set([...prev, role as Role]))
        }
      }
      if (event.type === 'wave_start') {
        if (myRole) router.push(`/game/${roomCode}/${myRole}`)
      }
    })
    return unsub
  }, [roomCode, myRole, router])

  async function handleStart() {
    if (!myRole || joined.size < 3) return
    setStarting(true)
    await supabase
      .from('game_sessions')
      .update({ status: 'playing' })
      .eq('room_code', roomCode)
    await publishEvent(roomCode, 'wave_start', { wave: 1 })
    router.push(`/game/${roomCode}/${myRole}`)
  }

  const allReady = joined.size === 3

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Room Code</p>
          <h1 className="text-6xl font-mono font-bold tracking-widest mt-1">{roomCode}</h1>
          {teamName && <p className="text-muted-foreground mt-2 text-sm">{teamName}</p>}
        </div>

        <div className="space-y-2">
          {ALL_ROLES.map(r => {
            const meta = ROLE_META[r]
            const isMe = r === myRole
            const present = joined.has(r)
            return (
              <Card key={r}>
                <CardContent className="flex items-center gap-3 py-3">
                  <span className="text-2xl">{meta.emoji}</span>
                  <div className="flex-1">
                    <span className="font-semibold text-sm">{meta.label}</span>
                    {isMe && (
                      <Badge variant="secondary" className="ml-2">you</Badge>
                    )}
                  </div>
                  <Badge variant={present ? 'default' : 'outline'}>
                    {present ? 'Ready' : 'Waiting…'}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {!allReady && (
          <p className="text-center text-muted-foreground text-sm">
            Share the room code with your teammates
          </p>
        )}

        {allReady && (
          <Button
            onClick={handleStart}
            disabled={starting}
            className="w-full h-14 text-lg font-bold"
          >
            {starting ? 'Starting…' : '⚔️ Start Game'}
          </Button>
        )}
      </div>
    </main>
  )
}
