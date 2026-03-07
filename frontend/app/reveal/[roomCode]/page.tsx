'use client'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/_shadcn/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function RevealPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const router = useRouter()

  const { data: session } = useQuery({
    queryKey: ['session', roomCode],
    queryFn: async () => {
      const { data } = await supabase
        .from('game_sessions')
        .select('team_name, score, waves_survived')
        .eq('room_code', roomCode)
        .single()
      return data
    },
  })

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-8 bg-background">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-widest">Game Over</p>
        <h1 className="text-5xl font-bold">🏰</h1>
        {session?.team_name && (
          <p className="text-xl font-semibold">{session.team_name}</p>
        )}
      </div>

      <div className="flex gap-12 text-center">
        <div>
          <p className="text-4xl font-mono font-bold">{session?.score ?? '—'}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Score</p>
        </div>
        <div>
          <p className="text-4xl font-mono font-bold">{session?.waves_survived ?? '—'}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Waves</p>
        </div>
      </div>

      <Button onClick={() => router.push('/')} variant="outline">
        Play Again
      </Button>
    </main>
  )
}
