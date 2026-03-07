import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ActivateAccount from './components/ActivateAccount';
import Dashboard from './components/Dashboard';

// Componente para proteger la ruta
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token'); 
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/activate/:uid/:token" element={<ActivateAccount />} />
        
        {/* Ruta del Dashboard Protegida */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* Redirigir la raíz al Dashboard si hay token, sino al Login */}
        <Route path="/" element={
          <Navigate to={localStorage.getItem('access_token') ? "/dashboard" : "/login"} />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;