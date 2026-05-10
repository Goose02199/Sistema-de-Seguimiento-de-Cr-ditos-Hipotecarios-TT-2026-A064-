import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, ExternalLink, 
  AlertTriangle, CheckCircle, Clock, ArrowLeft,
  Briefcase
} from 'lucide-react';

const BrokerPortfolio = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        // 1. Obtenemos el ID del bróker logueado
        const userRes = await api.get('/auth/me/');
        const brokerId = userRes.data.id;

        // 2. Pedimos solo las solicitudes asignadas a este bróker
        const response = await api.get(`/mortgage/portfolio/?assigned_broker_id=${brokerId}`);
        
        // 3. Filtramos para excluir las que aún están pendientes de aceptar
        // (es decir, quitamos 'broker_assigned' o 'assigning_broker')
        const dataArray = Array.isArray(response.data) ? response.data : response.data.results || [];
        const activeApplications = dataArray.filter(
          app => app.status !== 'broker_assigned' && app.status !== 'assigning_broker'
        );

        setApplications(activeApplications);
      } catch (error) {
        console.error("Error al cargar la cartera:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const getRiskBadge = (label) => {
    const styles = {
      'Bajo': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Medio': 'bg-amber-100 text-amber-700 border-amber-200',
      'Alto': 'bg-rose-100 text-rose-700 border-rose-200'
    };
    return styles[label] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const filteredApps = applications.filter(app => 
    app.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="animate-spin text-[#1A4E5E] mb-4">
        <Briefcase size={40} />
      </div>
      <p className="text-slate-500 animate-pulse font-medium">Cargando tu cartera activa...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-start md:items-center gap-4">
          
          {/* 4. Botón arreglado con navigate(-1) para volver a la pantalla anterior */}
          <button 
            onClick={() => navigate('/inicio_broker')} 
            className="p-2 mt-1 md:mt-0 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-[#1A4E5E]"
            title="Regresar al panel principal"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div>
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="text-[#1A4E5E]" size={32} /> Mi Cartera Activa
            </h2>
            <p className="text-slate-500 mt-1">Gestión de prospectos en curso y análisis de riesgo hipotecario.</p>
          </div>
        </div>
        {/* Buscador (Se mantiene a la derecha gracias al justify-between) */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por cliente..."
            className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E] outline-none w-full md:w-72 shadow-sm transition-shadow"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-5 font-bold">Folio</th>
                <th className="px-6 py-5 font-bold">Cliente</th>
                <th className="px-6 py-5 font-bold">Monto Solicitado</th>
                <th className="px-6 py-5 font-bold">Riesgo (IA)</th>
                <th className="px-6 py-5 font-bold">Estatus Actual</th>
                <th className="px-6 py-5 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">#{app.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{app.full_name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{app.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    ${new Intl.NumberFormat('es-MX').format(app.loan_amnt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadge(app.risk_label)}`}>
                      {app.risk_label || 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 w-max px-3 py-1.5 rounded-lg">
                      {app.status === 'finished' ? <CheckCircle size={14} className="text-emerald-500" /> : <Clock size={14} className="text-[#1A4E5E]" />}
                      <span className="uppercase tracking-wide">{app.status.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/tramite/${app.id}`)} // <--- Cambio clave aquí
                      className="p-2.5 text-[#1A4E5E] bg-indigo-50 hover:bg-[#1A4E5E] hover:text-white rounded-xl transition-all shadow-sm group-hover:shadow"
                      title="Gestionar trámite"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredApps.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Briefcase size={48} className="mb-4 text-slate-200" />
            <p className="font-medium text-lg text-slate-500">No hay trámites activos.</p>
            <p className="text-sm">Las solicitudes que aceptes aparecerán aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerPortfolio;