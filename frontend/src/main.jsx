import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthProvider'
import { DataProvider } from './context/DataProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <App />
          <Toaster
            position="top-right"
            gutter={10}
            containerClassName="clms-toaster"
            toastOptions={{
              duration: 3800,
              style: {
                maxWidth: '420px',
                fontSize: '12.5px',
                lineHeight: '1.5',
                borderRadius: '10px',
                color: '#0f172a',
                boxShadow:
                  '0 12px 32px -8px rgba(15, 23, 42, 0.18), 0 2px 8px -2px rgba(15, 23, 42, 0.08)',
              },
              success: {
                iconTheme: { primary: '#047857', secondary: '#ffffff' },
              },
              error: {
                iconTheme: { primary: '#b91c1c', secondary: '#ffffff' },
              },
            }}
          />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
