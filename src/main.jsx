import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import UnsavedNavigationGuard from './components/UnsavedNavigationGuard.jsx'
import { ConfirmationDialogHost } from './components/ConfirmationDialog.jsx'
import './styles.css'
import './dashboard-design.css'
import './landing-design.css'

createRoot(document.getElementById('root')).render(
  <StrictMode><RouterProvider router={createBrowserRouter([{path:"*",element:<><UnsavedNavigationGuard/><App/><ConfirmationDialogHost/></>}])}/></StrictMode>,
)
