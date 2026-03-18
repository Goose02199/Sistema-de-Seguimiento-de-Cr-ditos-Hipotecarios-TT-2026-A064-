import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2, Check, Circle, AlertCircle } from 'lucide-react';
import api from '../api/api';

const PasswordResetConfirm = () => {
  const { uid, token } = useParams(); // Extraemos los datos de la URL [cite: 2026-03-05]
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const currentPassword = passwords.new_password;

  // Reutilizamos tus checks de seguridad [cite: 2026-03-16]
  const checks = {
    length: passwords.new_password.length >= 8,
    hasNumber: /\d/.test(passwords.new_password),
    isMatch: passwords.new_password === passwords.confirm_password && passwords.new_password !== '',
    isNotSimple: currentPassword.length > 0 && 
                 !['12345678', 'password', 'qwertyui', 'admin123', 'escom2026'].includes(currentPassword.toLowerCase())
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checks.length || !checks.hasNumber || !checks.isMatch || !checks.isNotSimple) return;

    setLoading(true);
    try {
      await api.post('/password-reset-confirm/', { 
        uid, token, 
        new_password: passwords.new_password 
      });
      setStatusMsg({ type: 'success', text: '¡Contraseña restablecida! Redirigiendo...' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setStatusMsg({ type: 'error', text: 'El enlace expiró o es inválido.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Nueva Contraseña</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <input 
            type="password" placeholder="Nueva contraseña"
            className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl outline-none focus:border-[#1A4E5E] transition"
            onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
          />
          <input 
            type="password" placeholder="Confirmar contraseña"
            className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl outline-none focus:border-[#1A4E5E] transition"
            onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})}
          />

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <CheckItem met={checks.length} text="Mínimo 8 caracteres" />
            <CheckItem met={checks.hasNumber} text="Incluir al menos un número" />
            <CheckItem met={checks.isNotSimple} text="No usar palabras comúnes" />
            <CheckItem met={checks.isMatch} text="Las contraseñas coinciden" />
          </div>

          <button 
            disabled={loading || !checks.isMatch || !checks.length}
            className="w-full bg-[#1A4E5E] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#133A46] disabled:bg-slate-300 transition"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Restablecer Contraseña'}
          </button>

          {statusMsg.text && (
            <div className={`p-4 rounded-xl text-center font-medium ${statusMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {statusMsg.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const CheckItem = ({ met, text }) => (
  <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-600' : 'text-slate-400'}`}>
    {met ? <Check size={16} /> : <Circle size={16} />} {text}
  </div>
);

export default PasswordResetConfirm; 