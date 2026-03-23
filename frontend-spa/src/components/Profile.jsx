import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/api';
import { User, Mail, Shield, Calendar, Lock, Loader2, Check, Circle, AlertCircle } from 'lucide-react';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);

  // 1. Formulario para Datos Personales (Solo los campos editables)
  const { 
    register: registerProfile, 
    handleSubmit: handleSubmitProfile, 
    reset: resetProfile  
  } = useForm();

  // 2. Formulario para Seguridad (Password)
  const { 
    register: registerPass, 
    handleSubmit: handleSubmitPass, 
    watch: watchPass, 
    reset: resetPass, 
    formState: { errors: errorsPass, isSubmitting: isSubmittingPass } 
  } = useForm();

  const { 
    register: registerDelete, 
    handleSubmit: handleSubmitDelete, 
    formState: { isSubmitting: isDeletingAccount } 
  } = useForm();

  const newPasswordValue = watchPass("new_password", "");

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
        // Pre-cargamos los valores en el formulario de perfil
        resetProfile(response.data);
      } catch (error) {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [resetProfile]);

  const onPasswordChange = async (data) => {
    setPassMsg({ type: '', text: '' });
    try {
      await api.post(`/change-password/`, data);
      setPassMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      resetPass(); // Limpia solo el formulario de password
    } catch (error) {
      const errorDetail = error.response?.data;
      setPassMsg({ 
        type: 'error', 
        text: errorDetail?.new_password?.[0] || errorDetail?.old_password?.[0] || 'Error al cambiar la contraseña.' 
      });
    }
  };

  const onUpdateProfile = async (data) => {
    setProfileMsg({ type: '', text: '' });
    try {
      await api.patch('/me/', data); 
      setProfileMsg({ type: 'success', text: 'Datos actualizados correctamente.' });
      setUserData({ ...userData, ...data });
      setIsEditing(false);
    } catch (error) {
      // Extraemos el primer error que encontremos en el objeto de respuesta [cite: 2026-03-23]
      const serverErrors = error.response?.data;
      let errorText = 'Error al actualizar.';

      if (serverErrors) {
        // Si el error es {"phone": ["..."]}, tomamos ese mensaje
        const firstKey = Object.keys(serverErrors)[0];
        errorText = `${firstKey}: ${serverErrors[firstKey][0]}`;
      }
      
      setProfileMsg({ type: 'error', text: errorText });
    }
  };

  const onDeleteAccount = async (data) => {
    if (!window.confirm("¿Estás seguro? Esta acción desactivará tu acceso permanentemente.")) return;
    
    try {
      await api.post('/deactivate-account/', data);
      // Limpieza de tokens y salida
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      setPassMsg({ type: 'error', text: error.response?.data?.error || 'Error al desactivar cuenta.' });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-[#1A4E5E]" size={48} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Sección: Información General (Solo Lectura) */}
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

      {/* SECCIÓN 2: Información de Contacto (Editable) */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Datos Personales</h2>
          <button 
            onClick={() => {
              setIsEditing(!isEditing);
              setProfileMsg({ type: '', text: '' }); // <-- ESTO LIMPIA EL MENSAJE [cite: 2026-03-18]
            }}
            className="text-sm font-bold text-[#1A4E5E] hover:underline"
          >
            {isEditing ? 'Cancelar' : 'Editar Datos'}
          </button>
        </div>

        <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField 
            label="Teléfono" 
            name="phone" 
            register={registerProfile} 
            isEditing={isEditing} 
            defaultValue={userData.phone} 
          />
          <EditableField 
            label="Estado Civil" 
            name="marital_status" 
            register={registerProfile} 
            isEditing={isEditing} 
            defaultValue={userData.marital_status} 
          />
          <EditableField 
            label="CURP/RFC" 
            name="curp_rfc" 
            register={registerProfile} 
            isEditing={isEditing} 
            defaultValue={userData.curp_rfc} 
          />
          <EditableField 
            label="Dirección" 
            name="address" 
            register={registerProfile} 
            isEditing={isEditing} 
            defaultValue={userData.address} 
          />
          <EditableField 
            label="Código Postal" 
            name="postal_code" 
            register={registerProfile} 
            isEditing={isEditing} 
            defaultValue={userData.postal_code} 
          />
          <EditableField 
            label="Estado" 
            name="state" 
            register={registerProfile} 
            isEditing={isEditing} 
            defaultValue={userData.state} 
          />
          <EditableField 
            label="Municipio" 
            name="municipality" 
            register={registerProfile} 
            isEditing={isEditing} 
            defaultValue={userData.municipality} 
          />
          <EditableField 
            label="Housing_status" 
            name="housing_status" 
            register={registerProfile} 
            isEditing={isEditing} 
            defaultValue={userData.housing_status} 
          />
          
          {isEditing && (
            <div className="md:col-span-2">
              <button type="submit" className="bg-[#1A4E5E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#133A46] transition-all">
                Guardar Cambios
              </button>
            </div>
          )}

          {profileMsg.text && (
            <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 font-medium ${
              profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {profileMsg.type === 'success' ? <Check size={20}/> : <AlertCircle size={20}/>}
              {profileMsg.text}
            </div>
          )}
        </form>
      </section>

      {/* SECCIÓN 3: Seguridad (Password) */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-slate-100 rounded-lg text-[#1A4E5E]"><Lock size={24}/></div>
          <h2 className="text-2xl font-bold text-slate-800">Seguridad de la Cuenta</h2>
        </div>

        <form onSubmit={handleSubmitPass(onPasswordChange)} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña Actual</label>
              <input 
                {...registerPass("old_password", { required: true })}
                type="password" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E] outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nueva Contraseña</label>
                <input 
                  {...registerPass("new_password", { required: true })}
                  type="password" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirmar Nueva</label>
                <input 
                  {...registerPass("confirm_password", { 
                    required: true,
                    validate: v => v === newPasswordValue || "Las contraseñas no coinciden"
                  })}
                  type="password" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E] outline-none transition"
                />
              </div>
            </div>
            {errorsPass.confirm_password && <p className="text-red-500 text-xs font-bold">{errorsPass.confirm_password.message}</p>}

            <button 
              type="submit" 
              disabled={isSubmittingPass}
              className="w-full bg-[#1A4E5E] text-white py-3 rounded-xl font-bold hover:bg-[#133A46] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmittingPass ? <Loader2 className="animate-spin" size={20}/> : 'Actualizar Contraseña'}
            </button>

            {passMsg.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 font-medium ${passMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {passMsg.type === 'success' ? <Check size={20}/> : <AlertCircle size={20}/>}
                {passMsg.text}
              </div>
            )}
          </div>

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

      {/* SECCIÓN 4: Zona de Peligro (RF_EXT_1) */}
      <section className="bg-red-50 rounded-2xl shadow-sm border border-red-100 p-8 mt-12">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="text-red-600" size={24}/>
          <h2 className="text-2xl font-bold text-red-800">Zona de Peligro</h2>
        </div>
        
        <p className="text-sm text-red-600 mb-6 font-medium">
          Al desactivar tu cuenta, perderás acceso a todos tus simuladores y expedientes. 
          Esta acción es definitiva para tu perfil de usuario.
        </p>

        <form onSubmit={handleSubmitDelete(onDeleteAccount)} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-red-800 uppercase mb-2">Confirmar con Contraseña</label>
            <input 
              {...registerDelete("password", { required: true })}
              type="password" 
              placeholder="Ingresa tu contraseña actual"
              className="w-full px-4 py-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none transition bg-white"
            />
          </div>
          <button 
            type="submit"
            disabled={isDeletingAccount}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {isDeletingAccount ? 'Procesando...' : 'Desactivar Cuenta'}
          </button>
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

const EditableField = ({ label, name, register, isEditing, defaultValue }) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{label}</label>
    {isEditing ? (
      <input 
        {...register(name)} 
        defaultValue={defaultValue}
        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1A4E5E] outline-none"
      />
    ) : (
      <p className="text-slate-800 font-semibold">{defaultValue || 'No especificado'}</p>
    )}
  </div>
);

export default Profile;