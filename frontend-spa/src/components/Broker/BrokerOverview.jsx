import React, { useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock, 
  MapPin, 
  AlertCircle , Briefcase, ArrowRight, ArrowLeft
} from 'lucide-react';

const BrokerOverview = () => {
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // Para el loading de los botones
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [activeApplications, setActiveApplications] = useState([]);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userRes = await api.get('/auth/me/');
      const brokerId = userRes.data.id;

      // Pedimos TODAS las del bróker (sin filtrar por status en la URL)
      const appRes = await api.get(`/mortgage/portfolio/?assigned_broker_id=${brokerId}`);
      const allApps = Array.isArray(appRes.data) ? appRes.data : appRes.data.results || [];

      // 1. Filtramos las que son "Nuevas Asignaciones"
      const pending = allApps.filter(app => app.status === 'broker_assigned');
      
      // 2. Filtramos las que ya están en curso (Aceptadas)
      const active = allApps.filter(app => app.status !== 'broker_assigned' && app.status !== 'assigning_broker');

      setPendingApplications(pending);
      setActiveApplications(active.slice(0, 3)); // Solo tomamos las 3 más recientes para el resumen

    } catch (err) {
      console.error("Error obteniendo solicitudes:", err);
      setError("No se pudieron cargar los datos del panel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 2. Lógica para Aceptar la Solicitud
  const handleAccept = async (applicationId) => {
    try {
      setProcessingId(applicationId);
      await api.patch(`/mortgage/applications/${applicationId}/`, {
        status: 'reviewing_quote'
      });
      
      // Removemos la solicitud de la lista visual
      setPendingApplications(prev => prev.filter(app => app.id !== applicationId));
    } catch (err) {
      console.error("Error al aceptar:", err);
      setError("Hubo un error al aceptar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  // 3. Lógica para Declinar la Solicitud (La lógica de exclusión se hará después en el backend)
  const handleDecline = async (applicationId) => {
    try {
      setProcessingId(applicationId);
      await api.patch(`/mortgage/applications/${applicationId}/`, {
        status: 'assigning_broker'
      });
      
      // Removemos la solicitud de la lista visual
      setPendingApplications(prev => prev.filter(app => app.id !== applicationId));
    } catch (err) {
      console.error("Error al declinar:", err);
      setError("Hubo un error al declinar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2 className="animate-spin text-[#1A4E5E] mb-4" size={40} />
      <p className="text-slate-500 animate-pulse font-medium">Cargando bandeja de entrada...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nuevas Asignaciones</h1>
          <p className="text-slate-500 mt-1">Solicitudes en tu zona que requieren tu confirmación para iniciar el trámite.</p>
        </div>
        <div className="bg-indigo-50 text-[#1A4E5E] px-4 py-2 rounded-xl font-semibold border border-indigo-100 flex items-center gap-2 shadow-sm">
          <Clock size={18} />
          <span>{pendingApplications.length} pendientes</span>
        </div>
      </header>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {pendingApplications.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">¡Todo al día!</h3>
          <p className="text-slate-500 max-w-md">
            No tienes solicitudes hipotecarias pendientes por revisar en este momento. Te notificaremos cuando el sistema te asigne una nueva.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingApplications.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col relative overflow-hidden group">
              
              {/* Etiqueta decorativa superior */}
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Folio #{app.id}</span>
                    <h3 className="font-bold text-slate-900 leading-tight">Crédito Hipotecario</h3>
                  </div>
                </div>
              </div>

              {/* Información Relevante (Zona CDMX) */}
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-start gap-3 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <MapPin size={16} className="text-[#1A4E5E] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase">Zona de Asignación</p>
                    <p className="text-slate-800 font-medium tracking-wide">CP: {app.postal_code || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                  onClick={() => handleDecline(app.id)}
                  disabled={processingId === app.id}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors disabled:opacity-50"
                >
                  {processingId === app.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                  Declinar
                </button>
                
                <button
                  onClick={() => handleAccept(app.id)}
                  disabled={processingId === app.id}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white bg-[#1A4E5E] hover:bg-[#133a46] transition-transform hover:scale-105 shadow-sm disabled:opacity-50 disabled:hover:scale-100"
                >
                  {processingId === app.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Aceptar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- NUEVA SECCIÓN: TRÁMITES EN CURSO (RESUMEN) --- */}
      <div className="mt-16 mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="text-[#1A4E5E]" size={24} /> Trámites en Curso
            </h2>
            <p className="text-slate-500 text-sm mt-1">Un vistazo a tus casos activos más recientes.</p>
          </div>
          <button
            onClick={() => navigate('/cartera')}
            className="text-[#1A4E5E] font-bold hover:text-[#133a46] flex items-center gap-1 transition-all hover:gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm"
          >
            Ver toda mi cartera <ArrowRight size={18} />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {activeApplications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Aún no tienes trámites en curso. Acepta una nueva asignación para comenzar.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeApplications.map((app) => (
                <div key={app.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 group-hover:bg-[#1A4E5E] group-hover:text-white transition-colors">
                      id: {app.id}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{app.full_name}</h4>
                      <p className="text-xs text-slate-500 font-medium">${new Intl.NumberFormat('es-MX').format(app.loan_amnt)} solicitados</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider">
                      {app.status.replace(/_/g, ' ')}
                    </span>
                    <button 
                      onClick={() => navigate(`/tramite/${app.id}`)}
                      className="text-slate-400 hover:text-[#1A4E5E] transition-colors"
                      title="Ver detalles en cartera"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrokerOverview;