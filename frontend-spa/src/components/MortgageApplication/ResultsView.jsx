import React from 'react';
import { Send, Database, Braces } from 'lucide-react';

const ResultsView = ({ sentData, receivedData }) => {
  return (
    <div className="space-y-6 animate-in zoom-in duration-500 text-left">
      <div className="flex items-center gap-3 border-b pb-4">
        <Braces className="text-[#1A4E5E]" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Inspección de Payloads</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloque 1: Lo que salió del navegador */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest">
            <Send size={14} /> Request (JSON Enviado)
          </h3>
          <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-96 shadow-inner">
            <pre className="text-blue-400 text-[10px] font-mono leading-tight">
              {JSON.stringify(sentData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Bloque 2: Lo que respondió Django */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-bold text-green-600 uppercase tracking-widest">
            <Database size={14} /> Response (JSON Recibido)
          </h3>
          <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-96 shadow-inner">
            <pre className="text-green-400 text-[10px] font-mono leading-tight">
              {JSON.stringify(receivedData, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Resumen rápido para verificar que la IA funcionó */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
        <p className="text-sm font-bold text-slate-700 mb-2">Resumen de Predicción:</p>
        <div className="flex gap-4">
            <div className="px-3 py-1 bg-white border rounded text-xs">
                <span className="text-slate-400">Riesgo:</span> <span className="font-bold text-[#1A4E5E]">{receivedData?.risk_label}</span>
            </div>
            <div className="px-3 py-1 bg-white border rounded text-xs">
                <span className="text-slate-400">Status:</span> <span className="font-bold text-[#1A4E5E]">{receivedData?.status}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;