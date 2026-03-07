import React from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [loginError, setLoginError] = React.useState('');

  const onSubmit = async (data) => {
    setLoginError('');
    try {
      // data ya contiene { email, password } gracias a register() [cite: 2026-03-05]
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/login/`, data);
      
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      window.location.href = '/dashboard'; 
    } catch (error) {
      setLoginError('Credenciales incorrectas o cuenta no activada.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      {/* Contenedor principal con sombra */}
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-lg border border-slate-100">
        <h1 className="text-4xl font-bold text-center text-slate-900 mb-10 tracking-tight">Login</h1>

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
                type="password"
                placeholder="Ingrese su contraseña"
                className="w-full px-5 pl-12 py-4 border-2 border-slate-300 rounded-xl text-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
            </div>
          </div>

          {/* Enlace de recuperación */}
          <a href="/password-reset" className="block text-base text-slate-600 hover:text-slate-900 underline mt-3">
            ¿Olvidaste tu contraseña?
          </a>

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