import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ActivateAccount from './components/ActivateAccount';
import Profile from './components/Profile';
import AppLayout from './components/AppLayout';
import Overview from './components/Overview';

// Componente para proteger la ruta [cite: 2026-03-02]
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token'); 
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/activate/:uid/:token" element={<ActivateAccount />} />
        
        {/* Rutas Protegidas bajo el mismo Layout [cite: 2026-03-03] */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          {/* Al entrar a /dashboard, se renderiza Overview dentro de AppLayout */}
          <Route path="inicio" element={<Overview />} />
          
          {/* Tu anterior Dashboard ahora es la sección de Perfil */}
          <Route path="perfil" element={<Profile />} />
          
          {/* Redirigir la raíz del layout a la Vista General */}
          <Route index element={<Navigate to="/inicio" replace />} />
        </Route>

        {/* Fallback global */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;