import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SkulletProvider } from 'skullet/react'
import 'skullet/styles.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SkulletProvider
      mode="system"
      theme={{
        animation: 'shimmer',
        speed: 'slow',
        text: {
          top: 'ascender',
          bottom: 'descender',
        },
      }}
    >
      <App />
    </SkulletProvider>
  </StrictMode>,
)
