import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Mail, Shield, Calendar, LogOut, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('access_token'); // <-- Cambiado de 'token' a 'access_token'
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/me/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
      } catch (error) {
        console.error("Error al obtener datos", error);
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-[#1A4E5E]" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header del Perfil */}
          <div className="bg-[#1A4E5E] p-8 text-white flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{userData.full_name}</h1>
              <p className="opacity-80">Bienvenido al Sistema Hipotecario ESCOM</p>
            </div>
            <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 p-2 rounded-lg transition">
              <LogOut size={24} />
            </button>
          </div>

          {/* Grid de Datos Técnicos */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataCard icon={<Mail />} label="Correo Electrónico" value={userData.email} />
            <DataCard icon={<Shield />} label="Rol de Usuario" value={userData.role} />
            <DataCard icon={<Calendar />} label="Miembro desde" value={new Date(userData.date_joined).toLocaleDateString()} />
            <DataCard icon={<User />} label="Estado de Cuenta" value={userData.is_active ? '✅ Activo' : '❌ Inactivo'} />
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Información de Seguridad (JWT)</h3>
            <div className="bg-slate-200 p-4 rounded-lg break-all font-mono text-xs text-slate-600">
              Bearer {localStorage.getItem('token')?.substring(0, 50)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataCard = ({ icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
    <div className="text-[#1A4E5E] mt-1">{icon}</div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

export default Dashboard;