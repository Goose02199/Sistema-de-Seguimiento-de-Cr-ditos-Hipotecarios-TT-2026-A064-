import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { 
  FileText, Send, CheckCircle, Clock, 
  AlertCircle, ShieldCheck, FileQuestion, Plus
} from 'lucide-react';
import DocumentViewer from '../DocumentViewer'

// Diccionario de los tipos de documentos (Debe coincidir con models.py)
const AVAILABLE_DOCS = [
  { id: 'identificacion', label: 'Identificación Oficial' },
  { id: 'domicilio', label: 'Comprobante de Domicilio' },
  { id: 'ingresos', label: 'Comprobante de Ingresos' },
  { id: 'fiscal', label: 'Constancia de Situación Fiscal' },
  { id: 'buro', label: 'Reporte de Buró de Crédito' }
];

const DocumentManager = ({ app }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [reviewingDoc, setReviewingDoc] = useState(null);

  // 1. Cargar los documentos actuales del trámite
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/mortgage/applications/${app.id}/documents/`);
      setDocuments(response.data);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [app.id]);

  // 2. Manejar la selección de checkboxes
  const toggleSelection = (docId) => {
    setSelectedTypes(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  // 3. Enviar la solicitud al backend
  const handleRequestDocuments = async () => {
    if (selectedTypes.length === 0) return;
    
    try {
      setRequesting(true);
      await api.post(`/mortgage/applications/${app.id}/documents/`, {
        document_types: selectedTypes
      });
      
      // Limpiamos la selección y recargamos la lista
      setSelectedTypes([]);
      await fetchDocuments();
    } catch (error) {
      console.error("Error al solicitar documentos:", error);
    } finally {
      setRequesting(false);
    }
  };

  // 4. Lógica de Filtrado: Qué documentos ya se pidieron y cuáles faltan
  const requestedDocTypes = documents.map(doc => doc.document_type);
  const pendingToRequest = AVAILABLE_DOCS.filter(doc => !requestedDocTypes.includes(doc.id));

  // Utilidad para pintar los estados
  const StatusBadge = ({ status }) => {
    const configs = {
      'requested': { color: 'bg-slate-100 text-slate-600', icon: <Clock size={12} />, text: 'Esperando al cliente' },
      'under_review': { color: 'bg-amber-100 text-amber-700', icon: <FileQuestion size={12} />, text: 'Pendiente de tu revisión' },
      'approved': { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={12} />, text: 'Aprobado' },
      'rejected': { color: 'bg-rose-100 text-rose-700', icon: <AlertCircle size={12} />, text: 'Rechazado' },
    };
    const conf = configs[status] || configs['requested'];
    
    return (
      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${conf.color}`}>
        {conf.icon} {conf.text}
      </span>
    );
  };

  if (loading) {
    return <div className="py-12 flex justify-center"><Clock className="animate-spin text-[#1A4E5E]" size={32} /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      
      {/* COLUMNA IZQUIERDA: Solicitar Nuevos Documentos */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Plus className="text-[#1A4E5E]" size={18} /> Requerir Documentación
          </h3>
          
          {pendingToRequest.length === 0 ? (
            <div className="text-center py-6 bg-emerald-50 rounded-xl border border-emerald-100">
              <ShieldCheck className="mx-auto text-emerald-500 mb-2" size={28} />
              <p className="text-sm font-bold text-emerald-700">¡Todo solicitado!</p>
              <p className="text-xs text-emerald-600 mt-1">Has pedido todos los documentos posibles para este trámite.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-4">
                Selecciona los documentos que el cliente debe subir a la plataforma:
              </p>
              <div className="space-y-2 mb-6">
                {pendingToRequest.map(doc => (
                  <label key={doc.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedTypes.includes(doc.id)}
                      onChange={() => toggleSelection(doc.id)}
                      className="w-4 h-4 text-[#1A4E5E] rounded border-slate-300 focus:ring-[#1A4E5E]"
                    />
                    <span className="text-sm font-medium text-slate-700">{doc.label}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleRequestDocuments}
                disabled={selectedTypes.length === 0 || requesting}
                className="w-full flex items-center justify-center gap-2 bg-[#1A4E5E] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#133a46] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {requesting ? <Clock className="animate-spin" size={18} /> : <Send size={18} />}
                Solicitar Seleccionados
              </button>
            </>
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA: Expediente Actual */}
      <div className="lg:col-span-2">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-[#1A4E5E]" size={18} /> Expediente del Cliente
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
              {documents.length} / {AVAILABLE_DOCS.length} Solicitados
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <FileText size={48} className="text-slate-200 mb-4" />
              <p className="font-medium text-slate-500">El expediente está vacío.</p>
              <p className="text-sm mt-1">Utiliza el panel izquierdo para solicitar los primeros documentos.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <div key={doc.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{doc.document_name}</h4>
                    {/* Si fue rechazado, mostramos el motivo sutilmente */}
                    {doc.status === 'rejected' && doc.feedback && (
                      <p className="text-xs text-rose-600 mt-1 flex items-start gap-1 bg-rose-50 p-2 rounded-lg border border-rose-100">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" /> 
                        <span>Motivo: {doc.feedback}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <StatusBadge status={doc.status} />
                    
                    {/* AQUÍ AGREGAREMOS LOS BOTONES DE VISUALIZAR Y CALIFICAR EN EL PRÓXIMO PASO */}
                    <button 
                      onClick={() => setReviewingDoc(doc)} // <--- AÑADIMOS EL ONCLICK
                      disabled={doc.status === 'requested'}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                        doc.status === 'requested' 
                          ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed' 
                          : 'bg-[#1A4E5E] text-white hover:bg-[#133a46] shadow-sm' // <--- MEJORAMOS EL ESTILO
                      }`}
                      title={doc.status === 'requested' ? "El cliente aún no sube el archivo" : "Revisar documento"}
                    >
                      {doc.status === 'under_review' ? 'Revisar' : 'Ver Detalles'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        {/* Modal de Revisión (Aparece cuando reviewingDoc tiene un documento) */}
        {reviewingDoc && (
            <ReviewModal 
            doc={reviewingDoc} 
            onClose={() => setReviewingDoc(null)} 
            onRefresh={fetchDocuments} 
            />
        )}
    </div>
  );
};

const ReviewModal = ({ doc, onClose, onRefresh }) => {
  const [status, setStatus] = useState('approved');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (status === 'rejected' && !feedback.trim()) {
      alert('Debes escribir un motivo si rechazas el documento.');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/mortgage/documents/${doc.id}/`, {
        status: status,
        feedback: status === 'rejected' ? feedback : ''
      });
      onRefresh(); // Recarga la lista de documentos en el panel principal
      onClose(); // Cierra el modal
    } catch (error) {
      console.error("Error al calificar el documento:", error);
      alert("Hubo un error al guardar la calificación.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden border border-slate-200">
        
        {/* LADO IZQUIERDO: Visor del Documento Seguro */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 md:p-8 border-b md:border-b-0 md:border-r border-slate-200">
           <DocumentViewer documentId={doc.id} />
        </div>

        {/* LADO DERECHO: Controles de Calificación */}
        <div className="w-full md:w-96 bg-white flex flex-col h-full shrink-0">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Revisión de Documento</h3>
            <p className="text-sm text-slate-500">{doc.document_name}</p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* Opciones de Aprobación/Rechazo */}
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${status === 'approved' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="status" 
                  value="approved" 
                  checked={status === 'approved'} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div>
                  <p className="font-bold text-emerald-700">Aprobar Documento</p>
                  <p className="text-xs text-emerald-600">El documento cumple con todos los requisitos.</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${status === 'rejected' ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="status" 
                  value="rejected" 
                  checked={status === 'rejected'} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-5 h-5 text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <div>
                  <p className="font-bold text-rose-700">Rechazar Documento</p>
                  <p className="text-xs text-rose-600">Solicitar al cliente que lo suba de nuevo.</p>
                </div>
              </label>
            </div>

            {/* Campo de Feedback (Solo visible si se rechaza) */}
            {status === 'rejected' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-slate-700 mb-2">Motivo del rechazo:</label>
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Ej: El comprobante de domicilio no debe ser mayor a 3 meses de antigüedad."
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-[#1A4E5E] focus:border-[#1A4E5E] outline-none text-sm resize-none h-32"
                />
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50 mt-auto">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={submitting || (status === 'rejected' && !feedback.trim())}
              className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                status === 'approved' 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-rose-600 hover:bg-rose-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? <Clock className="animate-spin" size={18} /> : <CheckCircle size={18} />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;