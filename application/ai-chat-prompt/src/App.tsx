import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import OptimizePage from './pages/OptimizePage'
import AnalyzePage from './pages/AnalyzePage'
import SessionsPage from './pages/SessionsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route 
              path="chat" 
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="optimize" 
              element={
                <ProtectedRoute>
                  <OptimizePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="analyze" 
              element={
                <ProtectedRoute>
                  <AnalyzePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sessions" 
              element={
                <ProtectedRoute>
                  <SessionsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </ChatProvider>
    </AuthProvider>
  )
}

export default App 