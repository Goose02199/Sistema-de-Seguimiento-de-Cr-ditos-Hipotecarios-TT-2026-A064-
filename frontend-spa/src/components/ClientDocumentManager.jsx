import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api'; // Ajusta la ruta según tu estructura
import { 
  UploadCloud, CheckCircle, Clock, AlertCircle, 
  FileText, ArrowLeft, Loader2, ShieldCheck 
} from 'lucide-react';

const ClientDocumentManager = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // 1. Obtenemos quién es el usuario
      const userRes = await api.get('/auth/me/');
      // 2. Obtenemos su aplicación activa
      const appRes = await api.get(`/mortgage/applications/?user_id=${userRes.data.id}`);
      
      if (appRes.data && appRes.data.id) {
        // 3. Obtenemos los documentos de esa aplicación
        const docsRes = await api.get(`/mortgage/applications/${appRes.data.id}/documents/`);
        setDocuments(docsRes.data);
      } else {
        setError("No se encontró un trámite activo.");
      }
    } catch (err) {
      console.error("Error al cargar documentos:", err);
      setError("Hubo un error al cargar tu expediente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e, docId) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación rápida en frontend (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande. El máximo permitido es 5MB.");
      return;
    }

    try {
      setUploadingId(docId);
      
      // Para enviar archivos binarios, DEBEMOS usar FormData, no JSON
      const formData = new FormData();
      formData.append('file', file);

      await api.patch(`/mortgage/documents/${docId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Recargamos para ver el nuevo estatus (under_review)
      await fetchDocuments();
    } catch (err) {
      console.error("Error al subir archivo:", err);
      alert("No se pudo cargar el archivo. Verifica el formato e inténtalo de nuevo.");
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-[#1A4E5E] mb-4" size={40} />
        <p className="text-slate-500 font-medium">Cargando tu bóveda de documentos...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-rose-500 font-bold">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <button 
        onClick={() => navigate('/inicio')}
        className="flex items-center gap-2 text-slate-500 hover:text-[#1A4E5E] transition-colors mb-6 font-medium"
      >
        <ArrowLeft size={20} /> Volver a mi panel
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ShieldCheck className="text-[#1A4E5E]" size={36} /> Carga de Documentos
        </h1>
        <p className="text-slate-500 mt-2">
          Sube tus archivos en formato PDF, JPG o PNG. Tu información está encriptada y segura.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <FileText size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Aún no hay requerimientos</h3>
          <p className="text-slate-500 mt-2">Tu bróker te notificará cuando necesite que subas documentos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {documents.map((doc) => (
            <div key={doc.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
              
              {/* Información del Documento */}
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg">{doc.document_name}</h3>
                
                {/* Lógica de Estatus Visual */}
                {doc.status === 'approved' && (
                  <p className="text-emerald-600 text-sm font-bold flex items-center gap-1.5 mt-1">
                    <CheckCircle size={16} /> Verificado y aprobado
                  </p>
                )}
                {doc.status === 'under_review' && (
                  <p className="text-amber-600 text-sm font-bold flex items-center gap-1.5 mt-1">
                    <Clock size={16} /> En revisión por tu bróker
                  </p>
                )}
                {doc.status === 'requested' && (
                  <p className="text-slate-500 text-sm font-medium mt-1">
                    Pendiente de carga. Máx 5MB.
                  </p>
                )}
                {doc.status === 'rejected' && (
                  <div className="mt-2 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                    <p className="text-rose-700 text-sm font-bold flex items-center gap-1.5">
                      <AlertCircle size={16} /> Documento rechazado
                    </p>
                    <p className="text-rose-600 text-xs mt-1 font-medium">{doc.feedback}</p>
                  </div>
                )}
              </div>

              {/* Controles de Carga */}
              <div className="shrink-0 w-full md:w-auto">
                {(doc.status === 'requested' || doc.status === 'rejected') ? (
                  <div className="relative">
                    <input 
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, doc.id)}
                      disabled={uploadingId === doc.id}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <button 
                      disabled={uploadingId === doc.id}
                      className={`w-full md:w-48 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm
                        ${uploadingId === doc.id 
                          ? 'bg-slate-100 text-slate-400' 
                          : 'bg-[#1A4E5E] text-white hover:bg-[#133a46] hover:scale-105'
                        }`}
                    >
                      {uploadingId === doc.id ? (
                        <><Loader2 className="animate-spin" size={20} /> Subiendo...</>
                      ) : (
                        <><UploadCloud size={20} /> Seleccionar Archivo</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="w-full md:w-48 text-center px-6 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold cursor-not-allowed border border-slate-200">
                    {doc.status === 'approved' ? 'Completado' : 'Bloqueado'}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientDocumentManager;