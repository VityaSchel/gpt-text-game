import { Button } from '@/shared/ui/button'
import React from 'react'
import cx from 'classnames'

export function GamePage({ initial }: {
  initial: { gameId: string, text: string, options: string[] }
}) {
  const [data, setData] = React.useState(initial)
  const [submitting, setSubmitting] = React.useState<false | number>(false)
  const [progress, setProgress] = React.useState(0)
  const [showButtons, setShowButtons] = React.useState(false)
  const [transitionDuration, setTransitionDuration] = React.useState(500)
  const [question, setQuestion] = React.useState(0)

  const handleSelect = async (i: number) => {
    setSubmitting(i)
    let interval: NodeJS.Timeout | undefined
    try {
      setProgress(0)
      interval = setInterval(() => {
        setProgress(progress => Math.min(1, progress + 10/8000))
      }, 10)
      const response = await fetch(import.meta.env.VITE_API_URL + '/game/' + data.gameId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option: i })
      }).then(req => req.json() as Promise<{ ok: false } | { ok: true, text: string, options: string[] }>)
      if(response.ok === false) {
        throw new Error('Ошибка')
      }
      setData({
        gameId: data.gameId,
        text: response.text,
        options: response.options
      })
      setQuestion(question => question + 1)
      setTransitionDuration(0)
      setTimeout(() => {
        setShowButtons(false)
        setTimeout(() => {
          setTransitionDuration(500)
          setTimeout(() => {
            setShowButtons(true)
          }, response.text.length * 15)
        }, 10)
      }, 10)
    } catch(e) {
      alert('Ошибка')
      console.error(e)
    } finally {
      clearInterval(interval)
      setSubmitting(false)
    }
  }

  React.useEffect(() => {
    setTimeout(() => {
      setShowButtons(true)
    }, initial.text.length * 15)
  }, [initial])

  return (
    <main className='flex items-center justify-center p-10 md:p-20 text-center min-h-screen relative'>
      <img src={`${import.meta.env.VITE_API_URL}/picture/${data.gameId}?q=${question}`} alt='' className='fixed top-0 left-0 w-full h-full object-cover blur-sm pointer-events-none' draggable={false} />
      <div className='flex flex-col items-center gap-2 text-center z-[10]'>
        <p className='mb-10 md:mb-20 w-[800px] max-w-full text-xl font-medium [text-shadow:0px_2px_6px_black]'>
          {<FadeInText>{data.text}</FadeInText>}
        </p>
        {data.options.map((option, i) => (
          <Button
            onClick={() => handleSelect(i)}
            disabled={submitting !== false}
            key={i}
            className={cx('max-w-full text-center transition-opacity', {
              'opacity-0 pointer-events-none': !showButtons,
              'opacity-100 ': showButtons
            })}
            style={{ 
              transitionDelay: transitionDuration === 0 ? `${transitionDuration}s` : `${i * 0.5}s`,
              transitionDuration: `${transitionDuration}ms`
            }}
            progress={i === submitting ? progress : 0}
          >
            {option}
          </Button>
        ))}
      </div>
    </main>
  )
}

export function FadeInText({ children }: { children: string }) {
  const [opacity, setOpacity] = React.useState(0)
  const [delay, setDelay] = React.useState(true)
  const [transitionDuration, setTransitionDuration] = React.useState('0.5s')

  React.useEffect(() => {
    setTransitionDuration('0s')
    setDelay(false)
    setTimeout(() => {
      setOpacity(0)
      setTimeout(() => {
        setDelay(true)
        setTransitionDuration('0.5s')
        setTimeout(() => {
          setOpacity(1)
        }, 10)
      }, 10)
    }, 10)
  }, [children])

  return (
    children.split('').map((char, i) => (
      <span key={i} className='transition-opacity' style={{
        transitionDuration: transitionDuration,
        transitionDelay: delay ? `${i * 0.015}s` : `0s`, 
        opacity 
      }}>{char}</span>
    ))
  )
}