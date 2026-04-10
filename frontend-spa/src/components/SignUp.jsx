import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/api';
import { User, Mail, Lock, Loader2, Check, Circle, Send } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";

// --- COMPONENTE DE REENVÍO INTEGRADO ---
const ResendActivation = ({ email }) => {
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  const handleResend = async () => {
    setLoading(true);
    setMessage('');
    try {
      await api.post('/auth/resend-activation/', { email });
      setMessage('Enlace reenviado con éxito.');
      setSeconds(60); // Bloqueo de 60 segundos por seguridad [cite: 2026-03-02]
    } catch (error) {
      setMessage('Error al reenviar. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-green-200">
      <p className="text-xs text-green-700 mb-2">¿No recibiste nada?</p>
      <button
        onClick={handleResend}
        type="button"
        disabled={seconds > 0 || loading}
        className="flex items-center justify-center gap-2 mx-auto text-sm font-bold text-[#1A4E5E] hover:text-[#133A46] disabled:text-slate-400 transition-colors"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Send size={14} />
        )}
        {seconds > 0 ? `Reenviar en ${seconds}s` : 'Reenviar enlace de activación'}
      </button>
      {message && <p className="text-[10px] mt-2 text-green-800 font-medium italic">{message}</p>}
    </div>
  );
};

const SignUp = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerError, setRegisterError] = useState('');
  const passwordValue = watch("password", ""); 
  const firstName = watch("first_name", "");
  const emailValue = watch("email", ""); // Necesitamos el correo para el reenvío

  const [captchaToken, setCaptchaToken] = useState(null);

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token); // Guardamos el token que Google nos devuelve
  };

  const checks = {
    length: passwordValue.length >= 8,
    hasNumber: /\d/.test(passwordValue),
    isNotSimple: passwordValue.length > 0 && 
               !['12345678', 'password', 'qwertyui', 'admin123'].includes(passwordValue.toLowerCase()) &&
               (firstName.length < 3 || !passwordValue.toLowerCase().includes(firstName.toLowerCase())) &&
               (emailValue.length < 3 || !passwordValue.toLowerCase().includes(emailValue.split('@')[0].toLowerCase()))
  };

  const onSubmit = async (data) => {
    if (!captchaToken) {
      setRegisterError("Por favor, resuelve el CAPTCHA.");
    return;
  }
    try {
      await api.post(`/auth/register/`, {...data, captcha_token: captchaToken});
      setRegisterSuccess('¡Éxito! Hemos enviado un enlace a tu correo.');
    } catch (error) {
      if (error.response?.data?.password) {
        setRegisterError(`Seguridad: ${error.response.data.password[0]}`);
      } else {
        setRegisterError(error.response?.data?.error || 'Error al crear la cuenta.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100">
        <h1 className="text-4xl font-bold text-center text-slate-900 mb-10 tracking-tight">Crear Cuenta</h1>

        {/* --- MOSTRAR ÉXITO Y REENVÍO --- */}
        {registerSuccess ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-green-50 p-8 rounded-2xl border border-green-100">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-green-100">
                <Check size={32} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">¡Casi listo!</h2>
              <p className="text-slate-600 mt-2">{registerSuccess}</p>
              
              {/* Pasamos el emailValue al componente de reenvío */}
              <ResendActivation email={emailValue} />
            </div>
            
            <a href="/login" className="block text-[#1A4E5E] font-bold hover:underline">
              Ir al inicio de sesión
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* ... Campos de formulario (First Name, Last Name) ... */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input {...register("first_name", { required: true })} type="text" placeholder="Nombre(s)" className="w-full px-4 pl-10 py-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-[#1A4E5E] outline-none transition" />
              </div>
              <div className="relative">
                <input {...register("last_name", { required: true })} type="text" placeholder="Apellido(s)" className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-[#1A4E5E] outline-none transition" />
              </div>
            </div>

            {/* Campo Correo */}
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input {...register("email", { required: "El correo es obligatorio" })} type="email" placeholder="Correo electrónico" className="w-full px-4 pl-10 py-3 border border-slate-300 rounded-lg bg-slate-50 text-base focus:ring-2 focus:ring-[#1A4E5E] outline-none transition" />
              {errors.email && <p className="text-red-600 text-sm mt-1 font-medium">{errors.email.message}</p>}
            </div>

            {/* Campo Contraseña y Checks */}
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input {...register("password", { required: "La contraseña es obligatoria" })} type="password" placeholder="Contraseña segura" className="w-full px-4 pl-10 py-3 border border-slate-300 rounded-lg bg-slate-50 text-base focus:ring-2 focus:ring-[#1A4E5E] outline-none transition" />
              
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

            {/* Confirmar Contraseña */}
            <div className="relative">
              <input 
                {...register("confirm_password", { 
                  required: "Confirme la contraseña",
                  validate: value => value === passwordValue || "Las contraseñas no coinciden"
                })} 
                type="password" placeholder="Confirmar contraseña" className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-base focus:ring-2 focus:ring-[#1A4E5E] outline-none transition" 
              />
              {errors.confirm_password && <p className="text-red-600 text-sm mt-1 font-medium">{errors.confirm_password.message}</p>}
            </div>

            <div className="flex justify-center my-6 scale-90 sm:scale-100">
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-[#1A4E5E] text-white py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 mt-6 hover:bg-[#133A46] transition-all shadow-lg active:scale-95 disabled:opacity-70">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Crear mi cuenta'}
            </button>

            {registerError && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold text-center animate-in slide-in-from-top-2 duration-300">
                {registerError}
              </div>
            )}
            
            <div className="border-t border-slate-100 mt-8 pt-6 text-center">
              <p className="text-slate-500 text-sm mb-4 font-medium">¿Ya eres parte del sistema?</p>
              <a href="/login" className="inline-block w-full border border-slate-200 bg-white text-slate-700 py-3 px-6 rounded-xl font-bold text-sm hover:bg-slate-50 transition">
                Volver al inicio de sesión
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUp;