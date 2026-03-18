import React, {useState, useRef} from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";


import api from '../api/api';

const Login = () => {
  const captchaRef = useRef(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();
  const [loginError, setLoginError] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    setLoginError('');
    
    // Si el captcha es visible, validar que tengamos el token [cite: 2026-03-02]
    if (showCaptcha && !captchaToken) {
      setLoginError('Por favor, resuelve el captcha.');
      return;
    }

    try {
      const payload = { ...data, captcha_token: captchaToken };
      const response = await api.post('/login/', payload);
      
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      window.location.href = '/overview'; 
    } catch (error) {
      const serverData = error.response?.data;
      
      setValue('password', ''); // Borramos solo la contraseña
      setCaptchaToken(null);    // Limpiamos el token viejo en el estado

      if (captchaRef.current) {
        captchaRef.current.reset(); // 4. Obligamos a Google a resetear el cuadro
      }

      // Si el servidor dice que debemos mostrar el captcha, activamos el estado
      if (serverData?.show_captcha) {
        setShowCaptcha(true);
      }
      
      setLoginError(serverData?.error || 'Credenciales incorrectas o cuenta no activada.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      {/* Contenedor principal con sombra */}
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-lg border border-slate-100">
        <h1 className="text-4xl font-bold text-center text-slate-900 mb-10 tracking-tight">Iniciar Sesión</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campo Correo */}
          <div>
            <label className="block text-lg font-medium text-slate-800 mb-2">Correo</label>
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
              <input
                {...register("email", { required: "El correo es obligatorio" })}
                type="email"
                placeholder="Ingrese su correo"
                className="w-full px-5 pl-12 py-4 border-2 border-slate-300 rounded-xl text-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-lg font-medium text-slate-800 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
              <input
                {...register("password", { required: "La contraseña es obligatoria" })}
                type={showPassword ? "text" : "password"} // Cambio dinámico
                placeholder="Ingrese su contraseña"
                className="w-full px-5 pl-12 pr-12 py-4 border-2 border-slate-300 rounded-xl text-lg focus:ring-2 focus:ring-slate-900 transition"
              />
              {/* Botón de ojo */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Enlace de recuperación */}
          <Link 
            to="/password-reset" 
            className="block text-base text-slate-600 hover:text-slate-900 underline mt-3"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          {showCaptcha && (
            <div className="flex justify-center my-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>
          )}
          {/* Botón Acceder (Estilo oscuro) */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1A4E5E] text-white py-4 px-6 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition duration-200 hover:bg-[#133A46] disabled:bg-slate-500 mt-8"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Acceder'}
          </button>

          {loginError && <p className="text-red-600 text-center text-lg mt-4">{loginError}</p>}
        </form>

        <div className="border-t border-slate-200 mt-10 pt-10 text-center">
          <p className="text-slate-700 text-lg mb-4">¿No tienes una cuenta?</p>
          {/* Botón Crear cuenta (Estilo claro) */}
          <a href="/signup" className="inline-block w-full border-2 border-slate-300 bg-slate-100 text-slate-900 py-4 px-6 rounded-xl font-medium text-lg transition duration-200 hover:bg-slate-200 hover:border-slate-400">
            Crear una cuenta
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;