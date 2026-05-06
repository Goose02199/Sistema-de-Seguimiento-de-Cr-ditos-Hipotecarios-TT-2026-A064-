import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { 
  Users, Search, ExternalLink, 
  AlertTriangle, CheckCircle, Clock 
} from 'lucide-react';
import ApplicationDetail from './ApplicationDetail';

const BrokerPortfolio = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await api.get('/mortgage/portfolio/');
        setApplications(response.data);
      } catch (error) {
        console.error("Error al cargar la cartera:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  if (selectedApp) {
    return <ApplicationDetail app={selectedApp} onBack={() => setSelectedApp(null)} />;
  }

  // Función para dar color a las etiquetas de riesgo de la IA
  const getRiskBadge = (label) => {
    const styles = {
      'Bajo': 'bg-green-100 text-green-700 border-green-200',
      'Medio': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Alto': 'bg-red-100 text-red-700 border-red-200'
    };
    return styles[label] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Filtrado básico por nombre
  const filteredApps = applications.filter(app => 
    app.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando cartera de clientes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-[#1A4E5E]" /> Cartera de Clientes
          </h2>
          <p className="text-gray-500 text-sm">Gestión de prospectos y análisis de riesgo hipotecario.</p>
        </div>

        {/* Buscador sencillo */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar cliente..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E] outline-none w-full md:w-64"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Aplicaciones */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold">Folio</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Monto Solicitado</th>
                <th className="px-6 py-4 font-bold">Riesgo (IA)</th>
                <th className="px-6 py-4 font-bold">Estatus</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">#{app.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-700">{app.full_name}</div>
                    <div className="text-xs text-gray-400">{app.email}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-600">
                    ${new Intl.NumberFormat().format(app.loan_amnt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getRiskBadge(app.risk_label)}`}>
                      {app.risk_label || 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                      {app.status === 'processed' ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} />}
                      {app.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedApp(app)}
                      className="p-2 text-[#1A4E5E] hover:bg-[#1A4E5E] hover:text-white rounded-lg transition-all"
                      title="Ver detalle completo"
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
          <div className="py-12 text-center text-gray-400">No se encontraron solicitudes registradas.</div>
        )}
      </div>
    </div>
  );
};

export default BrokerPortfolio;