import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/layout/textFonts'
import App from './App.tsx'
import { PlayStyleProvider } from './settings/PlayStyleProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlayStyleProvider>
      <App />
    </PlayStyleProvider>
  </StrictMode>,
)
