import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const ActivateAccount = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error

  useEffect(() => {
    const activate = async () => {
      try {
        // Llamada a la API real a través del Gateway [cite: 2026-03-03]
        await axios.get(`${import.meta.env.VITE_API_URL}/activate/${uid}/${token}/`);
        setStatus('success');
        setTimeout(() => navigate('/login'), 5000);
      } catch (err) {
        setStatus('error');
      }
    };
    activate();
  }, [uid, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto animate-spin text-blue-600 mb-4" size={50} />
            <h2 className="text-2xl font-bold text-slate-800">Verificando cuenta...</h2>
            <p className="text-slate-500 mt-2">Estamos validando tu enlace de seguridad.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto text-green-500 mb-4" size={60} />
            <h2 className="text-2xl font-bold text-slate-800">¡Cuenta Activada!</h2>
            <p className="text-slate-500 mt-2">Tu registro ha sido confirmado conforme a la LFPDPPP. Redirigiendo al login...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto text-red-500 mb-4" size={60} />
            <h2 className="text-2xl font-bold text-slate-800">Enlace Inválido</h2>
            <p className="text-slate-500 mt-2">El token ha expirado o ya fue utilizado. Por favor, solicita un nuevo registro.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivateAccount;