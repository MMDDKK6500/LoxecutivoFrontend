import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Cadastros from '../pages/Cadastros';
import Relatorios from '../pages/Relatorios';
import { ToastProvider } from '../contexts/ToastContext';
import ServiceHealthMonitor from '../components/layout/ServiceHealthMonitor';

// Componente para verificar se o token JWT existe no localStorage
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [now] = useState(() => Date.now());
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    if (exp && exp * 1000 > now) return children;
  } catch {
    // Malformed tokens are removed before showing the protected screen.
  }

  localStorage.removeItem('token');
  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ServiceHealthMonitor />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/cadastros/:tipo" element={<PrivateRoute><Cadastros /></PrivateRoute>} />
          <Route path="/relatorios" element={<PrivateRoute><Relatorios /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
