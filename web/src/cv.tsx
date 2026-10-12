// Second Vite entry of the Faucet build: the CV page, served at /Stellar-Faucet/cv/ (see cv/index.html).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CvApp } from './cv/CvApp'
import { Providers } from './shell/Providers'
import { Shell } from './shell/Shell'
import './shell/theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <Shell site="cv">
        <CvApp />
      </Shell>
    </Providers>
  </StrictMode>,
)
