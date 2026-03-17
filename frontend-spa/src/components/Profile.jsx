import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/api';
import { User, Mail, Shield, Calendar, Lock, Loader2, Check, Circle, AlertCircle } from 'lucide-react';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  
  // Lógica de validación reutilizada del SignUp [cite: 2026-03-05]
  const newPasswordValue = watch("new_password", "");
  const checks = {
    length: newPasswordValue.length >= 8,
    hasNumber: /\d/.test(newPasswordValue),
    isNotSimple: newPasswordValue.length > 0 && 
                 !['12345678', 'password', 'qwertyui'].includes(newPasswordValue.toLowerCase()) &&
                 (userData?.first_name.length < 3 || !newPasswordValue.toLowerCase().includes(userData?.first_name.toLowerCase()))
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/me/`);
        setUserData(response.data);
      } catch (error) {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const onPasswordChange = async (data) => {
    setMsg({ type: '', text: '' });
    try {
      await api.post(`/change-password/`, data);
      setMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      reset(); // Limpia el formulario
    } catch (error) {
      const errorDetail = error.response?.data;
      setMsg({ 
        type: 'error', 
        text: errorDetail?.new_password?.[0] || errorDetail?.old_password?.[0] || 'Error al cambiar la contraseña.' 
      });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-[#1A4E5E]" size={48} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Sección: Información General */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#1A4E5E] p-8 text-white">
          <h1 className="text-3xl font-bold">{userData.full_name}</h1>
          <p className="opacity-80">Gestión de identidad y seguridad de la cuenta</p>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataCard icon={<Mail size={20}/>} label="Correo" value={userData.email} />
          <DataCard icon={<Shield size={20}/>} label="Rol" value={userData.role} />
          <DataCard icon={<Calendar size={20}/>} label="Registro" value={new Date(userData.date_joined).toLocaleDateString()} />
          <DataCard icon={<User size={20}/>} label="Estado" value={userData.is_active ? 'Activo' : 'Inactivo'} />
        </div>
      </section>

      {/* Sección: Cambio de Contraseña (RF6 Internal) [cite: 2026-03-05] */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-slate-100 rounded-lg text-[#1A4E5E]"><Lock size={24}/></div>
          <h2 className="text-2xl font-bold text-slate-800">Seguridad de la Cuenta</h2>
        </div>

        <form onSubmit={handleSubmit(onPasswordChange)} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña Actual</label>
              <input 
                {...register("old_password", { required: true })}
                type="password" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E] outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nueva Contraseña</label>
                <input 
                  {...register("new_password", { required: true })}
                  type="password" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirmar Nueva</label>
                <input 
                  {...register("confirm_password", { 
                    required: true,
                    validate: v => v === newPasswordValue || "Las contraseñas no coinciden"
                  })}
                  type="password" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E] outline-none transition"
                />
              </div>
            </div>
            {errors.confirm_password && <p className="text-red-500 text-xs font-bold">{errors.confirm_password.message}</p>}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#1A4E5E] text-white py-3 rounded-xl font-bold hover:bg-[#133A46] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : 'Actualizar Contraseña'}
            </button>

            {msg.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {msg.type === 'success' ? <Check size={20}/> : <AlertCircle size={20}/>}
                {msg.text}
              </div>
            )}
          </div>

          {/* Requisitos Visuales (Igual al SignUp) */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 self-start">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Requisitos de Seguridad</h3>
            <div className="space-y-3">
              <CheckItem met={checks.length} text="Mínimo 8 caracteres" />
              <CheckItem met={checks.hasNumber} text="Incluir al menos un número" />
              <CheckItem met={checks.isNotSimple} text="No usar datos personales o comunes" />
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};

const DataCard = ({ icon, label, value }) => (
  <div className="p-4 border border-slate-100 rounded-xl">
    <div className="text-[#1A4E5E] mb-2">{icon}</div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-base font-semibold text-slate-800 truncate">{value}</p>
  </div>
);

const CheckItem = ({ met, text }) => (
  <div className={`flex items-center gap-3 text-sm font-medium transition-colors ${met ? 'text-green-600' : 'text-slate-400'}`}>
    {met ? <Check size={16} /> : <Circle size={16} />} {text}
  </div>
);

export default Profile;