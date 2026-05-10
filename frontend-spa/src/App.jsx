import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api/api'; 
import { Loader2 } from 'lucide-react';

import Login from './components/Login';
import SignUp from './components/SignUp';
import ActivateAccount from './components/ActivateAccount';
import Profile from './components/Profile';
import AppLayout from './components/AppLayout';
import Overview from './components/Overview';
import PasswordResetRequest from './components/PasswordResetRequest';
import PasswordResetConfirm from './components/PasswordResetConfirm';
import RoleGuard from './components/RoleGuard';
import BrokerPortfolio from './components/Broker/BrokerPortfolio';
import BrokerOverview from './components/Broker/BrokerOverview';
import ApplicationDetail from './components/Broker/ApplicationDetail';
import ClientDocumentManager from './components/ClientDocumentManager'; // o la ruta correcta


import MortgageStepper from './components/MortgageApplication/MortgageStepper';

// Componente para proteger la ruta [cite: 2026-03-02]
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token'); 
  return token ? children : <Navigate to="/login" />;
};

const RoleBasedRedirect = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await api.get('/auth/me/');
        setRole(res.data.role); 
      } catch (error) {
        console.error("Error obteniendo sesión", error);
        // Si hay error (ej. token expirado), forzamos login
        localStorage.removeItem('access_token');
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-[#1A4E5E] mb-4" size={40} />
      </div>
    );
  }

  // Lógica de decisión de rutas
  if (role === 'BROKER') {
    return <Navigate to="/inicio_broker" replace />;
  }
  
  // Por defecto, asumimos que es CLIENTE
  return <Navigate to="/inicio" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/activate/:uid/:token" element={<ActivateAccount />} />
        <Route path="/password-reset" element={<PasswordResetRequest />} />
        
        {/* Se eliminó la línea duplicada de password-reset-confirm */}
        <Route path="/password-reset-confirm/:uid/:token" element={<PasswordResetConfirm />} /> 

        {/* Rutas Protegidas bajo el mismo Layout */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          {/* NUEVO: La ruta base decide hacia dónde enviarte */}
          <Route index element={<RoleBasedRedirect />} />

          {/* Área exclusiva de CLIENTES */}
          <Route 
            path="inicio" 
            element={
              <RoleGuard allowedRoles={['CLIENTE']}>
                <Overview />
              </RoleGuard>
            } 
          />
          
          <Route 
            path="solicitud" 
            element={
              <RoleGuard allowedRoles={['CLIENTE']}>
                <MortgageStepper />
              </RoleGuard>
            } 
          />

          {/* Área exclusiva de BRÓKERS */}
          <Route 
            path="inicio_broker" 
            element={
              <RoleGuard allowedRoles={['BROKER']}>
                <BrokerOverview />
              </RoleGuard>
            } 
          />

          <Route 
            path="cartera" 
            element={
              <RoleGuard allowedRoles={['BROKER']}>
                <BrokerPortfolio />
              </RoleGuard>
            } 
          />

          <Route 
            path="tramite/:id" 
            element={
              <RoleGuard allowedRoles={['BROKER']}>
                <ApplicationDetail />
              </RoleGuard>
            } 
          />

          <Route 
            path="documentos" 
            element={
              <RoleGuard allowedRoles={['CLIENTE']}>
                <ClientDocumentManager />
              </RoleGuard>
            } 
          />

          {/* Ruta compartida (Ambos pueden editar su propio perfil) */}
          <Route 
            path="perfil" 
            element={
              <RoleGuard allowedRoles={['CLIENTE', 'BROKER']}>
                <Profile />
              </RoleGuard>
            } 
          />
          
        </Route>

        {/* Fallback global */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;