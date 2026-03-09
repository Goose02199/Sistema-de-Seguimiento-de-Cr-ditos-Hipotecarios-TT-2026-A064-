// src/components/Overview.jsx
import React from 'react';

const Overview = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Vista General</h1>
      <p className="text-slate-500 mb-8">Bienvenido de nuevo. Aquí aparecerá el resumen de tus operaciones.</p>
      
      {/* Espacio reservado para el Dashboard futuro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 font-medium">
            Módulo en desarrollo...
          </div>
        ))}
      </div>
    </div>
  );
};

export default Overview;