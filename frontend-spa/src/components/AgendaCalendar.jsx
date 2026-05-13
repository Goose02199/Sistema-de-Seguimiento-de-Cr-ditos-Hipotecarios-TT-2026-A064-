import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Video, User, Building2, ExternalLink, X } from 'lucide-react';
import api from '../api/api';
import { getUserDataFromToken } from '../utils/authUtils';

const AgendaCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const tokenData = getUserDataFromToken();
  const userRole = tokenData?.role || 'CLIENTE';
  const userId = tokenData?.user_id || tokenData?.id;

  useEffect(() => {
    fetchAppointments();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await api.get(`/mortgage/appointments/me/?month=${month}&year=${year}&user_id=${userId}&role=${userRole}`);
      setAppointments(response.data);
    } catch (err) {
      console.error("Error cargando agenda, usando datos simulados:", err);
      
      // ILUSIÓN ROTA: Usamos una fecha estática (el mes actual real) 
      // para que no persiga al usuario cuando cambia de mes en la UI.
      const realToday = new Date();
      setAppointments([
        { id: 1, application_id: 35, scheduled_at: new Date(realToday.getFullYear(), realToday.getMonth(), 15, 10, 30).toISOString(), duration_minutes: 60, meeting_type: 'virtual', location: 'https://zoom.us/j/123', client_name: 'Juan Pérez', broker_name: 'Tu Bróker', status: 'scheduled' },
        { id: 2, application_id: 42, scheduled_at: new Date(realToday.getFullYear(), realToday.getMonth(), 15, 16, 0).toISOString(), duration_minutes: 30, meeting_type: 'physical', location: 'Sucursal Centro', client_name: 'María García', broker_name: 'Tu Bróker', status: 'scheduled' },
        { id: 3, application_id: 12, scheduled_at: new Date(realToday.getFullYear(), realToday.getMonth(), 28, 9, 0).toISOString(), duration_minutes: 60, meeting_type: 'virtual', location: 'https://meet.google.com/abc', client_name: 'Carlos Ruiz', broker_name: 'Tu Bróker', status: 'scheduled' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const renderCalendar = () => {
    const days = [];
    const today = new Date();
    
    // Calculamos la medianoche de hoy para saber exactamente si un día ya pasó
    const todayAtMidnight = new Date(today);
    todayAtMidnight.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      
      const isToday = dateObj.toDateString() === today.toDateString();
      const isPast = dateObj < todayAtMidnight; // Lógica de día vencido
      
      const dayEvents = appointments.filter(appt => {
        const apptDate = new Date(appt.scheduled_at);
        return apptDate.getDate() === day && apptDate.getMonth() === currentDate.getMonth() && apptDate.getFullYear() === currentDate.getFullYear();
      });

      // Dinamismo de CSS para días pasados, hoy y futuros
      let dayClasses = "min-h-[100px] p-2 flex flex-col transition-all ";
      
      if (isToday) {
        dayClasses += "bg-blue-50/50 border border-blue-200 shadow-inner ";
      } else if (isPast) {
        dayClasses += "bg-slate-100/50 opacity-60 border border-slate-100 grayscale hover:grayscale-0 ";
      } else {
        dayClasses += "bg-white border border-slate-100 ";
      }

      if (dayEvents.length > 0) {
        dayClasses += "cursor-pointer hover:shadow-md hover:border-[#1A4E5E]/40 relative group z-10";
      }

      days.push(
        <div 
          key={day} 
          onClick={() => dayEvents.length > 0 && setSelectedDayEvents({ date: dateObj, events: dayEvents })}
          className={dayClasses}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors
              ${isToday ? 'bg-[#1A4E5E] text-white shadow-md' : isPast ? 'text-slate-400' : 'text-slate-700 group-hover:text-[#1A4E5E]'}`}>
              {day}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div key={idx} className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-1 rounded truncate flex items-center gap-1 shadow-sm">
                {event.meeting_type === 'virtual' ? <Video size={10}/> : <MapPin size={10}/>}
                {new Date(event.scheduled_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-[10px] text-slate-400 font-bold px-1">+ {dayEvents.length - 3} más</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-3 bg-[#1A4E5E] text-white rounded-2xl shadow-lg"><CalendarIcon size={28} /></div>
            Mi Agenda
          </h1>
          <p className="text-slate-500 mt-2">
            {userRole === 'BROKER' ? 'Visualiza tus próximos cierres y accesos directos a trámites.' : 'Fechas importantes para la firma de tu crédito.'}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronLeft size={20} /></button>
          <span className="w-40 text-center font-bold text-slate-800 text-lg capitalize">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
        {loading && (
           <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
             <Clock className="animate-spin text-[#1A4E5E] mb-2" size={32} />
             <p className="text-sm font-bold text-slate-600">Sincronizando agenda...</p>
           </div>
        )}

        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {dayNames.map((day, idx) => (
            <div key={idx} className="py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-slate-100 gap-px">
          {renderCalendar()}
        </div>
      </div>

      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-[#1A4E5E] p-6 text-white flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Citas programadas para el</p>
                <h3 className="text-2xl font-black capitalize">
                  {selectedDayEvents.date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
              </div>
              <button onClick={() => setSelectedDayEvents(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Lista de Eventos */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 bg-slate-50">
              {selectedDayEvents.events.map(event => (
                <div key={event.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg font-bold text-sm">
                      <Clock size={16} /> 
                      {new Date(event.scheduled_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      {event.duration_minutes} min
                    </div>
                  </div>

                  {/* TÍTULO Y BOTÓN DE ACCIÓN PARA EL BRÓKER */}
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-slate-800 text-lg">
                      Trámite #{event.application_id}
                    </h4>
                    
                    {userRole === 'BROKER' && (
                      <button 
                        onClick={() => navigate(`/tramite/${event.application_id}`)}
                        className="p-2.5 text-[#1A4E5E] bg-indigo-50 hover:bg-[#1A4E5E] hover:text-white rounded-xl transition-all shadow-sm"
                        title="Gestionar trámite"
                      >
                        <ExternalLink size={18} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 text-sm mb-4">
                    <User size={14} className="text-slate-400"/>
                    <span>{userRole === 'BROKER' ? `Cliente: ${event.client_name}` : `Bróker: ${event.broker_name}`}</span>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="mt-0.5 text-slate-400">
                      {event.meeting_type === 'virtual' ? <Video size={18} /> : <Building2 size={18} />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-500 uppercase">{event.meeting_type === 'virtual' ? 'Videollamada' : 'Presencial'}</p>
                      {event.meeting_type === 'virtual' ? (
                        <a href={event.location} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline truncate block">Unirse a la reunión</a>
                      ) : (
                        <p className="text-sm font-medium text-slate-700 truncate">{event.location}</p>
                      )}
                    </div>
                  </div>

                  {/* BOTÓN SUTIL PARA EL CLIENTE */}
                  {userRole === 'CLIENTE' && (
                    <button 
                      onClick={() => navigate('/inicio')}
                      className="w-full mt-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                      Ver mi línea de tiempo
                    </button>
                  )}

                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaCalendar;