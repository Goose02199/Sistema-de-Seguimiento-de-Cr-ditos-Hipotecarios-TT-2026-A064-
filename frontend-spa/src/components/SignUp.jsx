import React from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { User, Mail, Lock, Loader2, Check, Circle } from 'lucide-react';

const SignUp = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [registerSuccess, setRegisterSuccess] = React.useState('');
  const [registerError, setRegisterError] = React.useState('');

  // 1. Asegúrate de que el nombre coincida con lo que usas abajo
  const passwordValue = watch("password", ""); 

  // 2. Extraemos otros campos para compararlos (Seguridad proactiva)
  const firstName = watch("first_name", "");
  const email = watch("email", "");

  const checks = {
    length: passwordValue.length >= 8,
    hasNumber: /\d/.test(passwordValue),
    // Verificamos que no esté en la lista negra local y que no sea parte de su nombre o correo
    isNotSimple: passwordValue.length > 0 && 
             !['12345678', 'password', 'qwertyui', 'admin123'].includes(passwordValue.toLowerCase()) &&
             (firstName.length < 3 || !passwordValue.toLowerCase().includes(firstName.toLowerCase())) &&
             (email.length < 3 || !passwordValue.toLowerCase().includes(email.split('@')[0].toLowerCase()))
  };

  const onSubmit = async (data) => {
    setRegisterSuccess('');
    setRegisterError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/register/`, data);
      setRegisterSuccess('¡Éxito! Revisa tu correo.');
    } catch (error) {
      // Sincronización dinámica: leemos el error exacto de Django [cite: 2026-03-05]
      if (error.response?.data?.password) {
        setRegisterError(`Seguridad: ${error.response.data.password[0]}`);
      } else {
        setRegisterError(error.response?.data?.error || 'Error al crear la cuenta.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-lg border border-slate-100">
        <h1 className="text-4xl font-bold text-center text-slate-900 mb-10 tracking-tight">Registro</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input {...register("first_name", { required: true })} type="text" placeholder="Nombre(s)" className="w-full px-4 pl-10 py-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-[#1A4E5E] outline-none transition" />
            </div>
            <div className="relative">
              <input {...register("last_name", { required: true })} type="text" placeholder="Apellido(s)" className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-[#1A4E5E] outline-none transition" />
            </div>
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input {...register("email", { required: "El correo es obligatorio" })} type="email" placeholder="Correo" className="w-full px-4 pl-10 py-3 border border-slate-300 rounded-lg bg-slate-50 text-base focus:ring-2 focus:ring-[#1A4E5E] outline-none transition" />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input {...register("password", { required: "La contraseña es obligatoria" })} type="password" placeholder="Contraseña" className="w-full px-4 pl-10 py-3 border border-slate-300 rounded-lg bg-slate-50 text-base focus:ring-2 focus:ring-[#1A4E5E] outline-none transition" />
            
            {/* Lista de requisitos de seguridad (LFPDPPP) */}
            <div className="mt-3 space-y-1.5 px-1">
              <div className={`flex items-center gap-2 text-xs font-medium ${checks.length ? 'text-green-600' : 'text-slate-400'}`}>
                {checks.length ? <Check size={14} /> : <Circle size={14} />} Mínimo 8 caracteres
              </div>
              <div className={`flex items-center gap-2 text-xs font-medium ${checks.hasNumber ? 'text-green-600' : 'text-slate-400'}`}>
                {checks.hasNumber ? <Check size={14} /> : <Circle size={14} />} Incluir al menos un número
              </div>
              <div className={`flex items-center gap-2 text-xs font-medium ${checks.isNotSimple ? 'text-green-600' : 'text-slate-400'}`}>
                {checks.isNotSimple ? <Check size={14} /> : <Circle size={14} />} No usar palabras comunes
              </div>
            </div>
          </div>

          <div className="relative">
            <input 
              {...register("confirm_password", { 
                required: "Confirme la contraseña",
                validate: value => value === passwordValue || "Las contraseñas no coinciden"
              })} 
              type="password" placeholder="Confirmar Contraseña" className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-base focus:ring-2 focus:ring-[#1A4E5E] outline-none transition" 
            />
            {errors.confirm_password && <p className="text-red-600 text-sm mt-1">{errors.confirm_password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#1A4E5E] text-white py-4 px-6 rounded-lg font-bold text-lg flex items-center justify-center gap-3 mt-6 hover:bg-[#133A46] transition-all shadow-lg active:scale-95 disabled:opacity-70">
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Crear cuenta'}
          </button>

          {registerSuccess && <p className="text-green-600 text-center font-bold mt-4 bg-green-50 p-3 rounded-lg border border-green-100">{registerSuccess}</p>}
          {registerError && <p className="text-red-600 text-center font-bold mt-4 bg-red-50 p-3 rounded-lg border border-red-100">{registerError}</p>}
        </form>

        <div className="border-t border-slate-200 mt-8 pt-8 text-center">
          <p className="text-slate-700 text-lg mb-3">¿Ya tienes una cuenta?</p>
          <a href="/login" className="inline-block w-full border border-slate-300 bg-slate-100 text-slate-900 py-3 px-6 rounded-lg font-medium text-lg hover:bg-slate-200 transition">
            Iniciar sesión
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignUp;