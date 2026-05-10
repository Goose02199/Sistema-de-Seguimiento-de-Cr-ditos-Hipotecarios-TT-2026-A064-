import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Check, Clock, AlertCircle, Loader2, UploadCloud, ArrowRight, Plus, Minus, User, Mail, Phone } from 'lucide-react';

// 1. Orden cronológico de los estados (Happy Path) para calcular el progreso
const STATUS_ORDER = [
  'draft', 
  'sent_awaiting_ia',
  'assigning_broker', 
  'broker_assigned',
  'reviewing_quote', 
  'quote_approved', 
  'waiting_client_approval',
  'waiting_docs', 
  'docs_review', 
  'docs_approved',
  'waiting_appointment', 
  'appointment_scheduled',
  'finished'
];

// 2. Estructura anidada para Etapas y Subprocesos
const STAGES = [
  {
    id: 'stage_form', 
    label: 'Formulario',
    subSteps: [
      { id: 'draft', label: 'Llenando Formulario' },
      { id: 'sent_awaiting_ia', label: 'Enviado (Espera de IA)' }
    ]
  },
  {
    id: 'stage_assignment', 
    label: 'Asignación',
    subSteps: [
      { id: 'assigning_broker', label: 'Asignando Bróker' },
      { id: 'broker_assigned', label: 'Bróker Asignado' }
    ]
  },
  {
    id: 'stage_quote', 
    label: 'Cotización',
    subSteps: [
      { id: 'reviewing_quote', label: 'Revisando Cotización (Bróker)' },
      { id: 'quote_approved', label: 'Cotización Aprobada' },
      { id: 'waiting_client_approval', label: 'En espera de aceptación del cliente' }
    ]
  },
  {
    id: 'stage_docs', 
    label: 'Documentación',
    subSteps: [
      { id: 'waiting_docs', label: 'En espera de documentos' },
      { id: 'docs_review', label: 'Revisando documentos' },
      { id: 'docs_approved', label: 'Documentos aprobados' }
    ]
  },
  {
    id: 'stage_close', 
    label: 'Cierre',
    subSteps: [
      { id: 'waiting_appointment', label: 'En espera de agendamiento' },
      { id: 'appointment_scheduled', label: 'Cita agendada' }
    ]
  },
  {
    id: 'stage_finished', 
    label: 'Finalizado',
    subSteps: [
      { id: 'finished', label: 'Proceso finalizado' }
    ]
  }
];

// Helpers para manejar los estados de rechazo
const isStatusRejected = (status) => {
  if (!status) return false;
  return ['quote_rejected_broker', 'quote_rejected_client'].includes(status) || status.includes('rejected');
};

const getBaseStatusIndex = (status) => {
  if (!status || status === 'none') return -1;
  // Mapear los estados de rechazo a su paso correspondiente para el progreso visual
  if (status === 'quote_rejected_broker') return STATUS_ORDER.indexOf('reviewing_quote');
  if (status === 'quote_rejected_client') return STATUS_ORDER.indexOf('waiting_client_approval');
  if (status.includes('rejected')) return STATUS_ORDER.indexOf(status.replace('_rejected', '')); 
  return STATUS_ORDER.indexOf(status);
};

const Overview = () => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState({});
  const navigate = useNavigate();
  

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const userRes = await api.get('/auth/me/');
        const appRes = await api.get(`/mortgage/applications/?user_id=${userRes.data.id}`);
        if (appRes.data && appRes.data.id) setApplication(appRes.data);
      } catch (err) {
        console.error("Error:", err);
      } finally { setLoading(false); }
    };
    fetchStatus();
  }, []);

  const currentStatus = application?.status || 'none';
  const isRejected = isStatusRejected(currentStatus);
  const currentIndex = getBaseStatusIndex(currentStatus);
  const hasBrokerAssigned = currentIndex >= STATUS_ORDER.indexOf('broker_assigned');

  const brokerInfo = application?.broker_info || {
    full_name: "Asesor Hipotecario",
    email: "Pendiente de sincronizar...",
    phone: "Pendiente de sincronizar..."
  };

  // Auto-expandir la etapa activa cuando carga la aplicación
  useEffect(() => {
    if (currentIndex !== -1) {
      const activeStage = STAGES.find(s => {
        const start = STATUS_ORDER.indexOf(s.subSteps[0].id);
        const end = STATUS_ORDER.indexOf(s.subSteps[s.subSteps.length - 1].id);
        return currentIndex >= start && currentIndex <= end;
      });
      if (activeStage) {
        setExpandedStages(prev => ({ ...prev, [activeStage.id]: true }));
      }
    }
  }, [currentIndex]);

  const toggleStage = (stageId) => {
    setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const getStageStatus = (stage) => {
    if (currentIndex === -1) return 'pending';
    const stageStartIndex = STATUS_ORDER.indexOf(stage.subSteps[0].id);
    const stageEndIndex = STATUS_ORDER.indexOf(stage.subSteps[stage.subSteps.length - 1].id);

    if (currentIndex > stageEndIndex) return 'complete';
    if (currentIndex >= stageStartIndex && currentIndex <= stageEndIndex) {
      return isRejected ? 'error' : 'active';
    }
    return 'pending';
  };

  const getSubStepStatus = (subId) => {
    if (currentIndex === -1) return 'pending';
    const stepIndex = STATUS_ORDER.indexOf(subId);

    if (currentIndex > stepIndex) return 'complete';
    if (currentIndex === stepIndex) {
      return isRejected ? 'error' : 'active';
    }
    return 'pending';
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2 className="animate-spin text-[#1A4E5E] mb-4" size={40} />
      <p className="text-slate-500 animate-pulse font-medium">Sincronizando flujo...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 max-w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Seguimiento de Proceso</h1>
        <p className="text-slate-500">Línea de tiempo detallada de tu crédito hipotecario.</p>
      </header>

      {/* Contenedor principal con Scroll Horizontal dinámico */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-8 overflow-x-auto custom-scrollbar">
        <div className="flex items-center justify-center min-w-full w-max mx-auto py-20 px-12">
          {STAGES.map((stage, index) => {
            const stageStatus = getStageStatus(stage);
            const isExpanded = expandedStages[stage.id];
            const isLastStage = index === STAGES.length - 1;

            const largeBg = stageStatus === 'complete' ? 'bg-emerald-500 border-emerald-200 text-white' : 
                            stageStatus === 'active' ? 'bg-[#1A4E5E] border-indigo-100 text-white scale-110 shadow-xl' : 
                            stageStatus === 'error' ? 'bg-rose-500 border-rose-100 text-white' : 
                            'bg-white border-slate-200 text-slate-400';

            return (
              <React.Fragment key={stage.id}>
                {/* 1. NODO PRINCIPAL (Etapa) */}
                <div className="flex flex-col items-center relative flex-shrink-0">
                  <div className={`flex items-center justify-center rounded-full transition-all duration-500 z-10 w-20 h-20 border-4 ${largeBg}`}>
                    {stageStatus === 'complete' ? <Check size={28} strokeWidth={3} /> :
                     stageStatus === 'error' ? <AlertCircle size={28} /> :
                     <span className="font-bold text-lg">{index + 1}</span>}
                  </div>
                  <div className={`absolute -bottom-12 whitespace-nowrap text-center text-sm font-medium transition-colors
                    ${stageStatus === 'active' ? 'text-[#1A4E5E] font-bold' : 'text-slate-500'}`}>
                    {stage.label}
                  </div>
                </div>

                {/* 2. CONECTORES Y SUBPROCESOS (Si no es la última etapa) */}
                {!isLastStage && (
                  <div className="flex items-center flex-shrink-0">
                    {/* Línea hacia el botón toggle */}
                    <div className={`h-1 w-6 transition-colors duration-500 ${stageStatus === 'complete' || stageStatus === 'active' ? 'bg-emerald-400' : 'bg-slate-100'}`} />

                    {/* Botón Toggle */}
                    <button 
                      onClick={() => toggleStage(stage.id)}
                      title={isExpanded ? "Ocultar detalles" : "Ver subprocesos"}
                      className="w-7 h-7 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#1A4E5E] hover:text-[#1A4E5E] z-20 transition-all shadow-sm mx-1"
                    >
                      {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
                    </button>

                    {/* Subprocesos (Si está expandido) */}
                    {isExpanded && stage.subSteps.map((sub, subIdx) => {
                      const subStatus = getSubStepStatus(sub.id);
                      const smallBg = subStatus === 'complete' ? 'bg-emerald-500 border-emerald-200 text-white' :
                                      subStatus === 'active' ? 'bg-[#1A4E5E] border-indigo-100 text-white scale-110 shadow-lg' :
                                      subStatus === 'error' ? 'bg-rose-500 border-rose-100 text-white' :
                                      'bg-white border-slate-200 text-slate-400';

                      // Pintar la línea si el proceso anterior o actual ya avanzó
                      let isLineBeforeColored = false;
                      if (subIdx === 0) {
                        isLineBeforeColored = stageStatus === 'complete' || stageStatus === 'active';
                      } else {
                        const prevSubStatus = getSubStepStatus(stage.subSteps[subIdx - 1].id);
                        isLineBeforeColored = prevSubStatus === 'complete';
                      }

                      return (
                        <React.Fragment key={sub.id}>
                          {/* Línea hacia el subproceso */}
                          <div className={`h-1 w-8 lg:w-12 transition-colors duration-500 ${isLineBeforeColored ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                          
                          {/* Nodo del subproceso */}
                          <div className="flex flex-col items-center relative flex-shrink-0 mx-2">
                            <div className={`flex items-center justify-center rounded-full transition-all duration-500 z-10 w-10 h-10 border-2 ${smallBg}`}>
                              {subStatus === 'complete' ? <Check size={16} strokeWidth={3} /> :
                               subStatus === 'error' ? <AlertCircle size={16} /> :
                               <span className="font-bold text-xs">{subIdx + 1}</span>}
                            </div>
                            <div className={`absolute top-12 w-20 lg:w-24 text-[10px] leading-tight text-center transition-colors 
                                ${subStatus === 'active' ? 'text-[#1A4E5E] font-bold' : 'text-slate-400'}`}>
                                {sub.label}
                              </div>
                            </div>
                        </React.Fragment>
                      )
                    })}

                    {/* Línea hacia la SIGUIENTE etapa grande */}
                    <div className={`h-1 transition-all duration-500 ${isExpanded ? 'w-10' : 'w-16'} ${stageStatus === 'complete' ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* --- NUEVA CARTILLA DEL BRÓKER (Se muestra condicionalmente) --- */}
        {hasBrokerAssigned && (
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-indigo-50 text-[#1A4E5E] rounded-full flex items-center justify-center mb-4 shadow-inner border border-indigo-100">
              <User size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{brokerInfo.full_name}</h3>
            <p className="text-sm text-[#1A4E5E] font-semibold mb-4 bg-[#1A4E5E]/10 px-3 py-1 rounded-full">Tu Bróker Asignado</p>
            
            <div className="w-full space-y-3 mt-2 text-left">
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Mail size={18} className="text-slate-400" />
                <span className="text-sm font-medium truncate" title={brokerInfo.email}>{brokerInfo.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Phone size={18} className="text-slate-400" />
                <span className="text-sm font-medium">{brokerInfo.phone || 'No registrado'}</span>
              </div>
            </div>
          </div>
        )}

        {/* --- INFO CARD ADAPTADA --- */}
        <div className={`p-8 rounded-2xl border-2 flex flex-col md:flex-row items-center gap-6 transition-all ${hasBrokerAssigned ? 'lg:col-span-2' : 'lg:col-span-3'}
          ${isRejected ? 'bg-rose-50 border-rose-100' : 'bg-[#1A4E5E]/5 border-[#1A4E5E]/10'}`}>

          <div className={`p-4 rounded-2xl shadow-lg ${isRejected ? 'bg-rose-500' : 'bg-[#1A4E5E]'} text-white`}>
            {isRejected ? <AlertCircle size={32} /> : <Clock size={32} />}
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900">
              {isRejected ? "Atención Requerida" : "Información del Paso Actual"}
            </h3>
            <p className="text-slate-600 mt-1">
              Tu solicitud se encuentra en el estado: <span className="font-bold text-[#1A4E5E] uppercase">{currentStatus.replace(/_/g, ' ')}</span>.
            </p>
          </div>

          {/* LOGICA INTELIGENTE DEL BOTÓN */}
          {['waiting_docs', 'docs_review', 'docs_approved'].includes(currentStatus) ? (
            <button 
              onClick={() => navigate('/documentos')}
              className="bg-[#1A4E5E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#133a46] transition-transform hover:scale-105 shadow-md flex items-center gap-2 whitespace-nowrap"
            >
              <UploadCloud size={20} /> Subir Documentos
            </button>
          ) : (
            <button 
              onClick={() => navigate('/solicitud')}
              className="bg-[#1A4E5E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#133a46] transition-transform hover:scale-105 shadow-md flex items-center gap-2 whitespace-nowrap"
            >
              Gestionar Trámite <ArrowRight size={20} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Overview;