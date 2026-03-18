import React, { useState, useEffect, useRef } from 'react';
import { Mail, Send, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import axios from 'axios';

const PasswordResetRequest = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [status, setStatus] = useState({ type: '', text: '' });
  
  // Referencia para resetear el widget visualmente [cite: 2026-03-17]
  const recaptchaRef = useRef();

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  const handleRequest = async (e) => {
    if (e) e.preventDefault();
    setStatus({ type: '', text: '' });
    
    setLoading(true);
    try {
      await axios.post('https://www.2026-a064.lat/api/auth/password-reset-request/', { 
        email, 
        captcha_token: captchaToken 
      });

      // ÉXITO: Mostramos feedback y reseteamos el entorno
      setStatus({ 
        type: 'success', 
        text: 'Enlace enviado. Revisa tu bandeja de entrada (incluyendo spam).' 
      });
      setEmail(''); // Limpiamos el campo
      setCaptchaToken(null); 
      recaptchaRef.current.reset(); // Reseteamos el Captcha de Google
      setSeconds(60); 

    } catch (error) {
      const serverMsg = error.response?.data?.error;
      
      if (error.response?.status === 429) {
        // El servidor bloqueó la petición por tiempo [cite: 2026-03-17]
        setStatus({ type: 'error', text: serverMsg });
        setSeconds(60); // Sincronizamos el contador visual de nuevo
      } else {
        setStatus({ type: 'error', text: 'Error en la solicitud. Intenta más tarde.' });
      }
      recaptchaRef.current.reset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">Recuperar Clave</h2>
        <p className="text-slate-500 text-center mb-8">
          Ingresa tu correo para recibir las instrucciones de recuperación.
        </p>
        
        <form onSubmit={handleRequest} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
            <input 
              required type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo registrado"
              className="w-full px-5 pl-12 py-4 border-2 border-slate-200 rounded-xl outline-none focus:border-[#1A4E5E] transition"
            />
          </div>

          <div className="flex justify-center scale-90">
            <ReCAPTCHA 
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>

          <button 
            disabled={loading || !captchaToken || seconds > 0}
            className="w-full bg-[#1A4E5E] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#133A46] disabled:bg-slate-300 transition"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            {seconds > 0 ? `Reintentar en ${seconds}s` : 'Enviar enlace'}
          </button>

          {/* CUADRO DE ESTADO (Feedback dinámico) [cite: 2026-03-05] */}
          {status.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              status.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-100' 
              : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{status.text}</span>
            </div>
          )}
        </form>
        
        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <a href="/login" className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={16} /> Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetRequest;