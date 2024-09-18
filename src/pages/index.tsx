import { Button } from '@/shared/ui/button'
import React from 'react'

export function HomePage({ setInitial }: {
  setInitial: React.Dispatch<React.SetStateAction<{ gameId: string, text: string, options: string[] } | undefined>>
}) {
  const [isStarting, setIsStarting] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  const handleStart = async () => {
    setIsStarting(true)
    let interval: NodeJS.Timeout | undefined
    try {
      interval = setInterval(() => {
        setProgress(progress => Math.min(1, progress + 10/8000))
      }, 10)
      const response = await fetch(import.meta.env.VITE_API_URL + '/game', {
        method: 'POST'
      }).then(req => req.json() as Promise<{ ok: false } | { ok: true, gameId: string, text: string, options: string[] }>)
      if(response.ok === false) {
        throw new Error('Ошибка')
      }
      setInitial({
        gameId: response.gameId,
        text: response.text,
        options: response.options
      })
    } catch(e) {
      alert('Ошибка')
      console.error(e)
    } finally {
      clearInterval(interval)
      setIsStarting(false)
    }
  }

  return (
    <main className='flex items-center justify-center w-full min-h-screen'>
      <Button
        onClick={handleStart} 
        disabled={isStarting}
        progress={progress}
      >
        Начать
      </Button>
    </main>
  )
}