import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import { store } from './app/store'
import { AppProviders } from './components/AppProviders'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProviders>
  </StrictMode>,
)
