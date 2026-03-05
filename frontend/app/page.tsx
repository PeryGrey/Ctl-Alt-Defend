'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { publishEvent } from '@/lib/realtime'
import { Button } from '@/_shadcn/components/ui/button'
import { Input } from '@/_shadcn/components/ui/input'
import { Label } from '@/_shadcn/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/_shadcn/components/ui/card'
import { cn } from '@/lib/utils'

type Role = 'builder' | 'artillery' | 'alchemist'
type Mode = 'home' | 'create' | 'join'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const ROLES: { id: Role; label: string; emoji: string; desc: string }[] = [
  { id: 'builder',   label: 'Builder',   emoji: '🏗️', desc: 'Manage the castle — place weapons, reinforce walls' },
  { id: 'artillery', label: 'Artillery', emoji: '🎯', desc: 'Operate the weapons — fire, assign personnel, maintain' },
  { id: 'alchemist', label: 'Alchemist', emoji: '⚗️', desc: 'Read the radar — brew ammo, call out threats' },
]

export default function Page() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('home')
  const [teamName, setTeamName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setError('')
    setRole(null)
  }

  async function handleCreate() {
    if (!teamName.trim()) { setError('Enter a team name'); return }
    if (!role) { setError('Pick a role'); return }
    setLoading(true)
    setError('')
    const code = generateRoomCode()
    const { error: dbError } = await supabase
      .from('game_sessions')
      .insert({ room_code: code, team_name: teamName.trim(), status: 'waiting' })
    if (dbError) { setError('Failed to create room'); setLoading(false); return }
    await publishEvent(code, 'player_join', { role })
    router.push(`/lobby/${code}?role=${role}`)
  }

  async function handleJoin() {
    if (!roomCode.trim()) { setError('Enter a room code'); return }
    if (!role) { setError('Pick a role'); return }
    setLoading(true)
    setError('')
    const code = roomCode.trim().toUpperCase()
    const { data, error: dbError } = await supabase
      .from('game_sessions')
      .select('status')
      .eq('room_code', code)
      .single()
    if (dbError || !data) { setError('Room not found'); setLoading(false); return }
    if (data.status !== 'waiting') { setError('Game already started'); setLoading(false); return }
    await publishEvent(code, 'player_join', { role })
    router.push(`/lobby/${code}?role=${role}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">🏰 Ctrl + Alt + Defend</h1>
          <p className="text-muted-foreground mt-1 text-sm">Defend the castle. Don&apos;t let the walls fall.</p>
        </div>

        {mode === 'home' && (
          <div className="space-y-3">
            <Button
              onClick={() => setMode('create')}
              className="w-full h-12 text-base"
            >
              Create Room
            </Button>
            <Button
              variant="secondary"
              onClick={() => setMode('join')}
              className="w-full h-12 text-base"
            >
              Join Room
            </Button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => { setMode('home'); reset() }}>
              ← Back
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Create a Room</CardTitle>
                <CardDescription>Your teammates will join using your room code.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="team-name">Team name</Label>
                  <Input
                    id="team-name"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    placeholder="The Debugging Dragons"
                    maxLength={30}
                    className="h-10"
                  />
                </div>
                <RolePicker selected={role} onSelect={setRole} />
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full h-12 text-base"
                >
                  {loading ? 'Creating…' : 'Create Room'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => { setMode('home'); reset() }}>
              ← Back
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Join a Room</CardTitle>
                <CardDescription>Enter the 4-letter code from your teammate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="room-code">Room code</Label>
                  <Input
                    id="room-code"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    maxLength={4}
                    className="h-12 text-center text-2xl font-mono tracking-widest uppercase"
                  />
                </div>
                <RolePicker selected={role} onSelect={setRole} />
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  onClick={handleJoin}
                  disabled={loading}
                  className="w-full h-12 text-base"
                >
                  {loading ? 'Joining…' : 'Join Room'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}

function RolePicker({
  selected,
  onSelect,
}: {
  selected: Role | null
  onSelect: (r: Role) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>Pick your role</Label>
      <div className="space-y-2">
        {ROLES.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            className={cn(
              'w-full text-left px-3 py-2.5 rounded-md border text-sm transition-colors',
              selected === r.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            <span className="font-semibold text-foreground">{r.emoji} {r.label}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
