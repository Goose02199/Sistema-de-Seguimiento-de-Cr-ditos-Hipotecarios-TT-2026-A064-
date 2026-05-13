import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, ArrowRight, CheckCircle2, AlertCircle, CalendarCheck, MapPin, Video } from 'lucide-react';
import api from '../api/api';

const ClientAppointmentPicker = ({ onSuccess }) => {
  const { appointmentId } = useParams();
  const [slotsByDay, setSlotsByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Control de UI
  const [expandedDate, setExpandedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null); // { date, start, end }

  useEffect(() => {
    fetchAvailableSlots();
  }, [appointmentId]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/mortgage/appointments/${appointmentId}/slots/`);
      setSlotsByDay(response.data.available_slots);
    } catch (err) {
      setError("No se pudieron cargar los horarios disponibles. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async () => {
    // 1. BARRERA ANTI-DOBLE CLIC: Si ya está enviando, no hacer nada.
    if (!selectedSlot || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      
      const scheduledAt = `${selectedSlot.date}T${selectedSlot.start}:00`;
      
      await api.patch(`/mortgage/appointments/${appointmentId}/schedule/`, {
        scheduled_at: scheduledAt
      });

      // 2. ACTIVAMOS EL ÉXITO Y LIBERAMOS EL BOTÓN
      setIsSuccess(true);
      setSubmitting(false); 
      
    } catch (err) {
      setError(err.response?.data?.error || "Hubo un error al confirmar tu cita.");
      // Solo liberamos el botón si hubo un error real
      setSubmitting(false); 
    }
  };

  // --- NUEVA PANTALLA DE ÉXITO CON BOTÓN MANUAL ---
  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-emerald-50 rounded-3xl p-12 text-center border border-emerald-100 animate-in zoom-in duration-500 shadow-sm">
        <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-emerald-900 mb-2">¡Cita Confirmada!</h2>
        <p className="text-emerald-700 font-medium">
          Hemos agendado tu firma para el <span className="font-bold">{selectedSlot.dayFormatted}</span> a las <span className="font-bold">{selectedSlot.start}</span>.
        </p>
        
        <button
          type="button"
          onClick={() => window.location.href = '/inicio'}
          className="mt-8 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-transform hover:scale-105 shadow-md flex items-center justify-center gap-2 mx-auto"
        >
          Volver a mi Tablero <ArrowRight size={20} />
        </button>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Clock className="animate-spin text-[#1A4E5E]" size={40} />
        <p className="text-slate-500 font-medium">Buscando espacios disponibles...</p>
      </div>
    );
  }

  if (Object.keys(slotsByDay).length === 0) {
    return (
      <div className="p-8 text-center bg-amber-50 border border-amber-100 rounded-2xl">
        <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
        <p className="text-amber-800 font-bold">No hay horarios disponibles próximamente.</p>
        <p className="text-amber-600 text-sm">Por favor, contacta a tu bróker para que amplíe su agenda.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-slate-800">Finaliza tu trámite</h2>
        <p className="text-slate-500">Selecciona el día y la hora que mejor te acomode para la firma.</p>
      </div>

      {/* LISTA DE DÍAS */}
      <div className="space-y-3">
        {Object.entries(slotsByDay).map(([dateStr, slots]) => {
          const isExpanded = expandedDate === dateStr;
          const dateObj = new Date(dateStr + 'T00:00:00');
          const dayName = dateObj.toLocaleDateString('es-MX', { weekday: 'long' });
          const dayNum = dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });

          return (
            <div key={dateStr} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-sm">
              <button
                onClick={() => setExpandedDate(isExpanded ? null : dateStr)}
                className={`w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#1A4E5E]/10 p-2.5 rounded-xl text-[#1A4E5E]">
                    <Calendar size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{dayName}</span>
                    <span className="text-base font-bold text-slate-800">{dayNum}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
                    {slots.length} opciones
                  </span>
                  <ChevronRight className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} size={20} />
                </div>
              </button>

              {/* GRILLA DE HORARIOS (DESPLEGABLE) */}
              {isExpanded && (
                <div className="p-4 bg-white grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-300">
                  {slots.map((slot, idx) => {
                    const isSelected = selectedSlot?.date === dateStr && selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlot({ date: dateStr, dayFormatted: `${dayName} ${dayNum}`, ...slot })}
                        className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                          isSelected 
                          ? 'border-[#1A4E5E] bg-[#1A4E5E] text-white shadow-md' 
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-[#1A4E5E]/30'
                        }`}
                      >
                        {slot.start} - {slot.end}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER DE CONFIRMACIÓN (FLOTANTE O AL FINAL) */}
      {selectedSlot && (
        <div className="bg-[#1A4E5E] rounded-2xl p-6 text-white shadow-xl animate-in fade-in zoom-in duration-300">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-white/20 p-3 rounded-full">
              <CalendarCheck size={24} />
            </div>
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Cita seleccionada</p>
              <h4 className="text-lg font-bold capitalize">{selectedSlot.dayFormatted}</h4>
              <p className="text-xl font-black">{selectedSlot.start} a {selectedSlot.end}</p>
            </div>
          </div>

          <button
            onClick={handleConfirmAppointment}
            disabled={submitting}
            className="w-full py-4 bg-white text-[#1A4E5E] font-black rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {submitting ? <Clock className="animate-spin" /> : <CheckCircle2 size={20} />}
            CONFIRMAR MI CITA
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-2 border border-red-100">
          <AlertCircle size={18} />
          <p className="font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ClientAppointmentPicker;