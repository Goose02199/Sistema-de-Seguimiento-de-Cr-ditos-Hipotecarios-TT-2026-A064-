import React, { useState, useEffect } from 'react';
import api from '../api/api'; // Tu instancia de Axios configurada con el JWT
import { Loader2, AlertCircle } from 'lucide-react';

const DocumentViewer = ({ documentId }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSecureFile = async () => {
      try {
        setLoading(true);
        // IMPORTANTE: Pedimos la respuesta en formato 'blob' (datos binarios en crudo)
        const response = await api.get(`/mortgage/documents/${documentId}/view/`, {
          responseType: 'blob' 
        });

        // Averiguamos si es PDF o Imagen leyendo los headers que mandó Django
        const contentType = response.headers['content-type'];
        setFileType(contentType);

        // --- LA MAGIA EN REACT ---
        // Convertimos los datos binarios en una URL temporal del navegador
        const blob = new Blob([response.data], { type: contentType });
        const objectUrl = URL.createObjectURL(blob);
        
        setFileUrl(objectUrl);
      } catch (err) {
        console.error("Error cargando documento:", err);
        setError("No se pudo cargar el documento de forma segura.");
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchSecureFile();
    }

    // Limpieza: Borramos la URL temporal de la memoria cuando cerramos el componente
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [documentId]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#1A4E5E]" /></div>;
  if (error) return <div className="text-rose-500 flex items-center gap-2 p-4"><AlertCircle /> {error}</div>;

  return (
    <div className="w-full h-full min-h-[500px] bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
      {fileType?.includes('pdf') ? (
        // Si es PDF, usamos un iframe que ocupará todo el espacio
        <iframe 
          src={`${fileUrl}#toolbar=0`} // toolbar=0 esconde los botones de descarga nativos del navegador
          className="w-full h-[600px] border-none"
          title="Visor de PDF Seguro"
        />
      ) : (
        // Si es imagen, simplemente usamos img
        <img 
          src={fileUrl} 
          alt="Documento del Cliente" 
          className="max-w-full max-h-[600px] object-contain"
        />
      )}
    </div>
  );
};

export default DocumentViewer;