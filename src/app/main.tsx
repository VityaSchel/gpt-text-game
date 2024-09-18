import '@/shared/global.css'
import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HomePage } from '../pages/index'
import { GamePage } from '../pages/game'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

function App() {
  const [initial, setInitial] = React.useState<{ gameId: string, text: string, options: string[] }>()

  return initial ? (
    <GamePage initial={initial} />
  ) : (
    <HomePage setInitial={setInitial} />
  )
}