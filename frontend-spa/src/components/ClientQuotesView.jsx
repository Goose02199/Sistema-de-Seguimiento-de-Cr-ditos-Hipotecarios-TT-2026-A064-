import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Landmark, Loader2, CheckCircle2, AlertCircle, XCircle, 
  ArrowRight, Info, ChevronRight, X, ShieldCheck, Check
} from 'lucide-react';
import api from '../api/api';

const ClientQuotesView = () => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Estado para la selección del cliente
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  
  // Estado para el modal de detalles completos
  const [detailModalQuote, setDetailModalQuote] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const userRes = await api.get('/auth/me/');
        const appRes = await api.get(`/mortgage/applications/?user_id=${userRes.data.id}`);
        if (appRes.data && appRes.data.id) setApplication(appRes.data);
      } catch (err) {
        console.error("Error obteniendo la solicitud:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, []);

  const handleStatusUpdate = async (newStatus) => {
    setActionLoading(true);
    try {
      // Si acepta, podríamos enviar la cotización elegida al backend (opcional, si agregas el campo en Django)
      const extraData = newStatus === 'waiting_docs' ? { accepted_quote_id: selectedQuoteId } : {};
      
      await api.patch(`/mortgage/applications/${application.id}/`, {
        status: newStatus,
        ...extraData
      });
      
      // Redirigir al Overview para que vea el nuevo paso
      navigate('/overview');
    } catch (err) {
      console.error("Error al actualizar el trámite", err);
      alert("Ocurrió un error al procesar tu respuesta. Intenta de nuevo.");
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#1A4E5E] mb-4" size={40} />
        <p className="text-slate-500 font-medium animate-pulse">Cargando tu propuesta financiera...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">No se encontró tu expediente</h2>
      </div>
    );
  }

  // Si ya no está en etapa de aprobación, mostramos un mensaje
  if (application.status !== 'waiting_client_approval') {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm mt-10">
        <ShieldCheck size={64} className="text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-800 mb-4">Propuesta Procesada</h2>
        <p className="text-slate-500 mb-8 px-8">
          Ya has tomado una decisión sobre las cotizaciones o tu trámite ha avanzado a la siguiente etapa.
        </p>
        <button 
          onClick={() => navigate('/overview')}
          className="bg-[#1A4E5E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#133a46] transition-colors"
        >
          Ir a Seguimiento de Proceso
        </button>
      </div>
    );
  }

  const quotes = application.selected_quotes || [];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-24">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">Tu Propuesta Financiera</h1>
        <p className="text-slate-500 text-lg max-w-3xl">
          Tu asesor hipotecario ha analizado tu perfil y diseñado estas opciones. 
          Compara los escenarios, <strong>selecciona la opción que más te convenga</strong> y confirma tu decisión para continuar.
        </p>
      </header>

      {quotes.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl flex items-center gap-4">
          <AlertCircle size={24} />
          <p className="font-medium">Tu asesor aún no ha adjuntado los archivos de tu propuesta. Por favor, contacta a tu bróker.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {quotes.map((quote, idx) => {
            const isSelected = selectedQuoteId === quote.id;
            const data = quote.data;

            // Extraemos los valores clave homologados
            const mensualidad = data['Mensualidad Inicial'] || data['Mensualidad inicial'] || data['Mensualidad'];
            const tasa = data['Tasa'];
            const cat = data['CAT'];
            const pagoInicial = data['Pago inicial'] || data['Desembolso inicial'];
            const montoFinanciar = data['Monto a Financiar'] || data['Crédito Banco'] || data['Crédito Banorte'] || data['Crédito Santander'];

            return (
              <div 
                key={quote.id || idx}
                onClick={() => setSelectedQuoteId(quote.id)}
                className={`relative flex flex-col bg-white rounded-3xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected 
                    ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-xl scale-[1.02] z-10' 
                    : 'border-slate-200 shadow-sm hover:border-[#1A4E5E]/40 hover:shadow-md'
                }`}
              >
                {/* Header de la Tarjeta */}
                <div className={`p-6 border-b ${isSelected ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                      Opción {idx + 1}
                    </span>
                    {isSelected && <CheckCircle2 className="text-emerald-500 animate-in zoom-in" size={24} />}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Landmark size={20} className={isSelected ? "text-emerald-600" : "text-[#1A4E5E]"} /> 
                    {quote.banco}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 truncate" title={data['Nombre tasa'] || data['Escenario / Banda']}>
                    {data['Nombre tasa'] || data['Escenario / Banda']}
                  </p>
                </div>

                {/* Cuerpo de la Tarjeta (Datos Clave) */}
                <div className="p-6 flex-1 flex flex-col gap-5">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Mensualidad</p>
                    <p className="text-4xl font-black text-slate-900">{mensualidad}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Tasa Anual</p>
                      <p className="text-lg font-black text-[#1A4E5E]">{tasa}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">CAT</p>
                      <p className="text-lg font-black text-rose-600">{cat}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Monto del Crédito</span>
                      <span className="text-sm font-black text-slate-800">{montoFinanciar}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Pago Inicial (Enganche + Gastos)</span>
                      <span className="text-sm font-black text-slate-800">{pagoInicial}</span>
                    </div>
                  </div>
                </div>

                {/* Footer de la Tarjeta */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que se seleccione la tarjeta al dar clic en "Ver desglose"
                      setDetailModalQuote(quote);
                    }}
                    className="w-full py-2 text-xs font-bold text-[#1A4E5E] bg-white border border-slate-200 hover:border-[#1A4E5E] hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Info size={14} /> Ver Desglose Completo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BARRA DE ACCIÓN FLOTANTE */}
      {quotes.length > 0 && createPortal(
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              {selectedQuoteId ? (
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-2 justify-center md:justify-start">
                  <CheckCircle2 size={18} /> Has seleccionado una opción. ¿Listo para avanzar?
                </p>
              ) : (
                <p className="text-sm font-bold text-slate-500">
                  Haz clic sobre la opción que deseas elegir para habilitar el botón de continuar.
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button 
                disabled={actionLoading}
                onClick={() => handleStatusUpdate('quote_rejected_client')}
                className="w-full sm:w-auto px-6 py-3 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={18} /> Rechazar Opciones
              </button>
              
              <button 
                disabled={!selectedQuoteId || actionLoading}
                onClick={() => handleStatusUpdate('waiting_docs')}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-md ${
                  selectedQuoteId 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 hover:shadow-lg' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} 
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MODAL DE DESGLOSE COMPLETO (Cotización Completa) --- */}
      {detailModalQuote && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-200 bg-slate-50 shrink-0 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-[#1A4E5E] flex items-center gap-2">
                  <Landmark size={24} /> {detailModalQuote.banco}
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {detailModalQuote.data['Nombre tasa'] || detailModalQuote.data['Escenario / Banda']}
                </p>
              </div>
              <button 
                onClick={() => setDetailModalQuote(null)}
                className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors shadow-sm border border-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-auto flex-1 p-6 custom-scrollbar bg-white">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                Desglose Financiero Completo
              </h3>
              
              <div className="space-y-1">
                {Object.entries(detailModalQuote.data).map(([key, value]) => {
                  const keysToIgnore = ['Producto', 'Escenario / Banda', 'Nombre tasa', 'flujo_mensual'];
                  if (keysToIgnore.includes(key)) return null;

                  // Dar un poco de énfasis a variables totales
                  const isHighlight = key.includes('Mensualidad') || key.includes('Costo total') || key.includes('Monto');

                  return (
                    <div key={key} className={`flex justify-between items-start py-2.5 px-3 rounded-lg ${isHighlight ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                      <span className={`capitalize pr-4 ${isHighlight ? 'text-slate-700 font-bold text-sm' : 'text-slate-500 text-xs font-medium'}`}>
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-right ${isHighlight ? 'text-[#1A4E5E] font-black text-sm' : 'text-slate-800 font-bold text-xs'}`}>
                        {value !== null && value !== undefined ? value : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 shrink-0">
              <button 
                onClick={() => setDetailModalQuote(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Cerrar Desglose
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ClientQuotesView;