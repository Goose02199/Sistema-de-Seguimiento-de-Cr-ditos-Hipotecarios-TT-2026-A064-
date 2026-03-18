import React, { useState, useEffect } from 'react';
import { Mail, Send, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import api from '../api/api';

const PasswordResetRequest = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [captchaToken, setCaptchaToken] = useState(null);

  // Reutilizamos tu lógica de temporizador [cite: 2026-03-02]
  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!captchaToken) return alert("Por favor, resuelve el captcha.");
    
    setLoading(true);
    try {
      await api.post('/password-reset-request/', { email, captcha_token: captchaToken });
      setSent(true);
      setSeconds(60); // Activamos el enfriamiento que diseñaste
    } catch (error) {
      alert("Error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        {!sent ? (
          <>
            <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">Recuperar Clave</h2>
            <p className="text-slate-500 text-center mb-8">Enviaremos un enlace a tu correo institucional.</p>
            
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
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                />
              </div>

              <button 
                disabled={loading || !captchaToken}
                className="w-full bg-[#1A4E5E] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#133A46] disabled:bg-slate-300 transition"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                Enviar enlace
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <CheckCircle className="mx-auto text-green-500" size={64} />
            <h2 className="text-2xl font-bold text-slate-900">¡Correo enviado!</h2>
            <p className="text-slate-600">Revisa la bandeja de entrada de <b>{email}</b>.</p>
            
            {/* AQUÍ REUTILIZAMOS TU LÓGICA DE REENVÍO [cite: 2026-03-02] */}
            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={handleRequest}
                disabled={seconds > 0 || loading}
                className="text-sm font-bold text-[#1A4E5E] hover:underline disabled:text-slate-400"
              >
                {seconds > 0 ? `Reenviar en ${seconds}s` : '¿No llegó? Intentar de nuevo'}
              </button>
            </div>
          </div>
        )}
        
        <a href="/login" className="flex items-center justify-center gap-2 mt-8 text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={16} /> Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default PasswordResetRequest;