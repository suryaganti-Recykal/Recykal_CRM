import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import ContactDetail from './pages/ContactDetail'
import MarketLeadDetail from './pages/MarketLeadDetail'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import Deals from './pages/Deals'
import DealDetail from './pages/DealDetail'
import Tasks from './pages/Tasks'
import CareerApplications from './pages/CareerApplications'
import Newsletter from './pages/Newsletter'
import Settings from './pages/Settings'
import Reports from './pages/Reports'
import Quotes from './pages/Quotes'

function ProtectedRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <ProfileProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="contacts/:id" element={<ContactDetail />} />
          {/* recykal.market leads live in their own table with an independent id
              sequence, so they get their own route rather than sharing
              contacts/:id — the ids would otherwise collide. */}
          <Route path="market-leads/:id" element={<MarketLeadDetail />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="deals" element={<Deals />} />
          <Route path="deals/:id" element={<DealDetail />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="careers" element={<CareerApplications />} />
          <Route path="newsletter" element={<Newsletter />} />
          <Route path="reports" element={<Reports />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="settings/*" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ProfileProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ProtectedRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
