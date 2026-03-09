import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  Menu, Search, Bell, User, LogOut, Home, 
  Calculator, Calendar, HelpCircle, ChevronLeft 
} from 'lucide-react';
import axios from 'axios';

const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Recuperamos la información del perfil (Derechos ARCO/LFPDPPP)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/me/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        navigate('/login');
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* --- SIDEBAR (Barra Lateral) --- */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#1A4E5E] text-white transition-all duration-300 flex flex-col shadow-xl z-20`}>
        <div className="p-6 flex items-center gap-3 border-b border-[#133A46]">
          <div className="bg-white p-1.5 rounded-lg shrink-0">
            <Home className="text-[#1A4E5E]" size={24} />
          </div>
          {!isCollapsed && <span className="font-bold text-xl tracking-tight truncate">Logo title</span>}
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-2">
          <NavItem to="/inicio" icon={<Home size={20} />} label="Inicio" isCollapsed={isCollapsed} />
          <NavItem to="/simuladores" icon={<Calculator size={20} />} label="Simuladores" isCollapsed={isCollapsed} />
          <NavItem to="/agenda" icon={<Calendar size={20} />} label="Agenda" isCollapsed={isCollapsed} />
          <NavItem to="/perfil" icon={<User size={20} />} label="Mi perfil" isCollapsed={isCollapsed} />
        </nav>

        <div className="p-4 border-t border-[#133A46]">
          <NavItem to="/ayuda" icon={<HelpCircle size={20} />} label="Ayuda" isCollapsed={isCollapsed} />
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center gap-3 p-3 mt-2 hover:bg-[#133A46] rounded-xl transition-colors"
          >
            <ChevronLeft className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            {!isCollapsed && <span className="text-sm font-medium">Contraer</span>}
          </button>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* --- TOPBAR (Barra Superior) --- */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="relative w-96 max-w-md hidden md:block">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#1A4E5E] transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 hover:bg-slate-100 rounded-full transition-colors"
              >
                <div className="w-10 h-10 bg-[#1A4E5E] rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {user.first_name[0]}{user.last_name[0]}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-bold text-slate-900 leading-tight">{user.full_name}</p>
                  <p className="text-xs font-medium text-slate-500 capitalize">{user.role}</p>
                </div>
              </button>

              {/* Menú desplegable de perfil */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in zoom-in duration-200">
                  <Link to="/perfil" className="flex items-center gap-3 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                    <User size={18} /> Mi cuenta
                  </Link>
                  <hr className="my-2 border-slate-100" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={18} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- ÁREA DE PÁGINA ACTUAL (Dashboard, etc.) --- */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet /> {/* Aquí se inyectará el Dashboard o cualquier otra vista [cite: 2026-03-03] */}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label, isCollapsed }) => (
  <Link to={to} className="flex items-center gap-4 p-3.5 hover:bg-[#133A46] rounded-xl transition-all group overflow-hidden">
    <div className="shrink-0 transition-transform group-hover:scale-110">{icon}</div>
    {!isCollapsed && <span className="text-sm font-semibold tracking-wide truncate">{label}</span>}
  </Link>
);

export default AppLayout;