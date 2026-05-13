import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Video, Building2, CheckCircle, AlertCircle, Plus, Trash2, CalendarDays, X } from 'lucide-react';
import api from '../../api/api';

const AppointmentScheduler = ({ app, onStatusUpdate }) => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- NUEVO ESTADO PARA CONTROLAR LA EDICIÓN ---
  const [isEditing, setIsEditing] = useState(false);

  // Estados de la Cita
  const [meetingType, setMeetingType] = useState('physical');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState(60);
  
  // Estados de la Agenda
  const [scheduleData, setScheduleData] = useState({});
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [app.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let apptExists = false;
      try {
        const apptRes = await api.get(`/mortgage/applications/${app.id}/appointment/`);
        setAppointment(apptRes.data);
        
        // --- AQUÍ PRECARGAMOS LOS DATOS EN EL FORMULARIO ---
        setMeetingType(apptRes.data.meeting_type || 'physical');
        setLocation(apptRes.data.location || '');
        setDuration(apptRes.data.duration_minutes || 60);
        apptExists = true;
      } catch (e) {
        if (e.response?.status !== 404) console.error(e);
      }

      // --- CAMBIO CLAVE: SIEMPRE cargamos la agenda del bróker ---
      setScheduleLoading(true);
      const userId = localStorage.getItem('user_id') || app.assigned_broker_id; 
      const schedRes = await api.get(`/mortgage/broker/schedule/?user_id=${userId}`);
      setScheduleData(schedRes.data);
      
    } catch (err) {
      console.error("Error global:", err);
    } finally {
      setLoading(false);
      setScheduleLoading(false);
    }
  };

  const addTimeSlot = (dateStr) => {
    setScheduleData(prev => ({
      ...prev, [dateStr]: { ...prev[dateStr], available_slots: [...prev[dateStr].available_slots, { start_time: "09:00", end_time: "10:00" }] }
    }));
  };

  const removeTimeSlot = (dateStr, index) => {
    setScheduleData(prev => {
      const newSlots = [...prev[dateStr].available_slots];
      newSlots.splice(index, 1);
      return { ...prev, [dateStr]: { ...prev[dateStr], available_slots: newSlots } };
    });
  };

  const updateTimeSlot = (dateStr, index, field, value) => {
    setScheduleData(prev => {
      const newSlots = [...prev[dateStr].available_slots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return { ...prev, [dateStr]: { ...prev[dateStr], available_slots: newSlots } };
    });
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const userId = localStorage.getItem('user_id') || app.assigned_broker_id; 

      const payloadAgenda = { user_id: userId, agenda: {} };
      Object.keys(scheduleData).forEach(dateStr => {
         if (scheduleData[dateStr].available_slots.length > 0) {
             payloadAgenda.agenda[dateStr] = scheduleData[dateStr].available_slots.map(s => ({ start_time: s.start_time, end_time: s.end_time }));
         } else {
             payloadAgenda.agenda[dateStr] = []; 
         }
      });
      await api.post(`/mortgage/broker/availability/bulk/`, payloadAgenda);

      const payloadCita = { application: app.id, meeting_type: meetingType, location: location, duration_minutes: duration };
      await api.post(`/mortgage/appointments/`, payloadCita);
      
      setIsEditing(false); // Salimos del modo edición
      onStatusUpdate(); 
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData) {
        if (typeof responseData === 'string') setError(responseData);
        else if (responseData.error) setError(responseData.error);
        else {
          const firstKey = Object.keys(responseData)[0];
          const firstError = responseData[firstKey];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          const fieldNames = { location: 'Dirección/Enlace', duration_minutes: 'Duración' };
          setError(`${fieldNames[firstKey] || firstKey}: ${errorMessage}`);
        }
      } else {
        setError("Error de conexión al servidor.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Clock className="animate-spin inline mr-2"/> Cargando...</div>;

  // ==========================================
  // VISTA 1: CONFIGURACIÓN O EDICIÓN DE CITA
  // ==========================================
  // Renderiza si NO hay cita, o si decidimos editarla
  if (!appointment || isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 relative">
        
        {/* Si estamos editando, mostramos un botón para cancelar y volver atrás */}
        {appointment && isEditing && (
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute -top-4 -right-2 text-slate-400 hover:text-red-500 bg-white rounded-full p-1 shadow-sm border border-slate-100 transition-colors"
              title="Cancelar edición"
            >
              <X size={20} />
            </button>
        )}

        {/* ... (TODO TU CÓDIGO DEL FORMULARIO Y LA AGENDA QUEDA EXACTAMENTE IGUAL) ... */}
        
        {/* PANEL 1: CONFIGURACIÓN */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1A4E5E] text-white flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Detalles de la Reunión</h3>
              <p className="text-xs text-slate-500">Configura cómo y cuánto durará el cierre con el cliente.</p>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${meetingType === 'physical' ? 'border-[#1A4E5E] bg-blue-50/50' : 'border-slate-100 hover:border-slate-300'}`}>
                <input type="radio" name="meetingType" value="physical" checked={meetingType === 'physical'} onChange={(e) => setMeetingType(e.target.value)} className="sr-only" />
                <Building2 size={24} className={meetingType === 'physical' ? 'text-[#1A4E5E]' : 'text-slate-400'} />
                <span className={`font-bold text-sm ${meetingType === 'physical' ? 'text-[#1A4E5E]' : 'text-slate-600'}`}>Presencial</span>
              </label>

              <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${meetingType === 'virtual' ? 'border-[#1A4E5E] bg-blue-50/50' : 'border-slate-100 hover:border-slate-300'}`}>
                <input type="radio" name="meetingType" value="virtual" checked={meetingType === 'virtual'} onChange={(e) => setMeetingType(e.target.value)} className="sr-only" />
                <Video size={24} className={meetingType === 'virtual' ? 'text-[#1A4E5E]' : 'text-slate-400'} />
                <span className={`font-bold text-sm ${meetingType === 'virtual' ? 'text-[#1A4E5E]' : 'text-slate-600'}`}>Virtual (Video)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {meetingType === 'physical' ? 'Dirección' : 'Enlace de la Videollamada'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {meetingType === 'physical' ? <MapPin size={16} className="text-slate-400" /> : <Video size={16} className="text-slate-400" />}
                  </div>
                  <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} className="pl-10 w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E] focus:border-transparent outline-none text-sm" placeholder={meetingType === 'physical' ? 'Ej. Av. Reforma 123' : 'Ej. https://zoom.us/j/1234'} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duración de la cita</label>
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E] outline-none text-sm font-medium">
                  <option value={30}>30 Minutos (Firma Express)</option>
                  <option value={60}>1 Hora (Asesoría y Firma)</option>
                  <option value={90}>1 Hora 30 Minutos</option>
                  <option value={120}>2 Horas</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 2: LA AGENDA */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1A4E5E] text-white flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Tu Disponibilidad General (Próximos 14 días)</h3>
                <p className="text-xs text-slate-500">Agrega rangos horarios para que el cliente seleccione.</p>
              </div>
            </div>
          </div>

          <div className="p-0">
            {scheduleLoading ? (
               <div className="p-12 text-center text-slate-400"><Clock className="animate-spin inline mr-2"/> Cargando tu agenda...</div>
            ) : (
               <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto bg-slate-50/50">
                 {Object.entries(scheduleData).map(([dateStr, data]) => {
                    const dateObj = new Date(dateStr + 'T00:00:00'); 
                    const dayName = dateObj.toLocaleDateString('es-MX', { weekday: 'long' });
                    const dateFormatted = dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
                    const hasData = data.available_slots.length > 0 || data.busy_slots.length > 0;

                    return (
                      <div key={dateStr} className={`p-4 transition-colors ${hasData ? 'bg-white' : ''}`}>
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="w-32 shrink-0 flex flex-col justify-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dayName}</span>
                            <span className="text-sm font-black text-slate-800">{dateFormatted}</span>
                          </div>
                          <div className="flex-1 space-y-2">
                            {data.busy_slots.map((busy, i) => (
                               <div key={`busy-${i}`} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
                                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                  <span className="text-sm font-mono text-slate-500 line-through decoration-slate-400">{busy.start_time} - {busy.end_time}</span>
                                  <span className="text-xs font-bold text-slate-500 ml-auto bg-white px-2 py-0.5 rounded shadow-sm">{busy.label}</span>
                               </div>
                            ))}
                            {data.available_slots.map((slot, i) => (
                               <div key={`avail-${i}`} className="flex items-center gap-2">
                                  <input type="time" value={slot.start_time} onChange={(e) => updateTimeSlot(dateStr, i, 'start_time', e.target.value)} className="p-2 border border-blue-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none w-28 bg-blue-50 text-blue-900 font-bold" />
                                  <span className="text-slate-400">-</span>
                                  <input type="time" value={slot.end_time} onChange={(e) => updateTimeSlot(dateStr, i, 'end_time', e.target.value)} className="p-2 border border-blue-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none w-28 bg-blue-50 text-blue-900 font-bold" />
                                  <button onClick={() => removeTimeSlot(dateStr, i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar rango"><Trash2 size={18} /></button>
                               </div>
                            ))}
                            <button onClick={() => addTimeSlot(dateStr)} className="text-xs font-bold text-[#1A4E5E] hover:text-[#133a46] flex items-center gap-1 mt-1 py-1"><Plus size={14} /> Añadir horario libre</button>
                          </div>
                        </div>
                      </div>
                    );
                 })}
               </div>
            )}
          </div>
        </div>

        {error && (
           <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-start gap-2 border border-red-200 font-medium">
             <AlertCircle size={18} className="shrink-0 mt-0.5" />
             <p>{error}</p>
           </div>
        )}

        <button onClick={handleCreateInvitation} disabled={submitting || scheduleLoading} className="w-full py-4 bg-[#1A4E5E] text-white font-bold rounded-xl hover:bg-[#133a46] transition-colors shadow-sm flex items-center justify-center gap-2 text-lg disabled:opacity-50">
          {submitting ? <Clock className="animate-spin" /> : <CalendarDays />}
          {appointment ? "Actualizar Cambios" : "Guardar Disponibilidad y Generar Invitación"}
        </button>

      </div>
    );
  }

  // ==========================================
  // VISTA 2: EL CLIENTE DEBE ELEGIR (O YA ELIGIÓ)
  // ==========================================
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
      {appointment.status === 'pending_client' ? (
        <>
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <CalendarIcon size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Esperando al Cliente</h3>
          <p className="text-slate-500 text-sm mb-6">La invitación ha sido enviada...</p>
          <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-xs font-mono text-slate-600 mb-8">
            Dirección/enlace: {appointment.location}
          </div>
          <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-xs font-mono text-slate-600 mb-8 ml-2">
            Duración: {appointment.duration_minutes} min
          </div>
          
          <button 
            // --- AQUÍ ACTIVAMOS EL MODO EDICIÓN ---
            onClick={() => setIsEditing(true)} 
            className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors text-sm"
          >
            Modificar mi disponibilidad o cambiar link de reunión
          </button>
        </>
      ) : (
        <>
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4"><CheckCircle size={32} /></div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">¡Cita Programada!</h3>
          <p className="text-emerald-600 font-bold text-lg mb-6">{new Date(appointment.scheduled_at).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}</p>
          <div className="grid grid-cols-2 gap-4 text-left bg-slate-50 p-4 rounded-xl text-sm">
             <div><span className="block text-xs font-bold text-slate-400 uppercase">Modalidad</span><span className="font-bold text-slate-700">{appointment.meeting_type_display}</span></div>
             <div><span className="block text-xs font-bold text-slate-400 uppercase">Ubicación / Link</span><a href={appointment.location} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline truncate block">{appointment.location}</a></div>
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentScheduler;