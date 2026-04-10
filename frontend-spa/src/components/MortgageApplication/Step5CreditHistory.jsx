import React from 'react';
import { History, BarChart3, ListChecks, AlertTriangle, ShieldAlert } from 'lucide-react';

const Step5CreditHistory = ({ register, errors }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
      <History className="text-[#1A4E5E]" /> Sección 5: Información del Buró de Crédito
    </h2>

    {/* 5.1 Saldos y Límites */}
    <div className="bg-slate-50 p-4 rounded-lg space-y-4">
      <h3 className="text-sm font-bold text-[#1A4E5E] flex items-center gap-2 uppercase tracking-wider">
        <BarChart3 size={16} /> Saldos y Límites Revolventes
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div>
          <label className="block text-xs font-medium text-gray-700">Saldo Total Revolvente</label>
          <input 
            type="number"
            {...register("revol_bal", { required: true, min: 0 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="revol_bal"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Límite Total de Crédito</label>
          <input 
            type="number"
            {...register("total_rev_hi_lim", { required: true, min: 0 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="total_rev_hi_lim"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">% de Utilización</label>
          <input 
            type="number"
            step="0.01"
            {...register("revol_util", { required: true, min: 0, max: 100 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="Ej. 35.5"
          />
        </div>
      </div>
    </div>

    {/* 5.2 Cuentas e Historial */}
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[#1A4E5E] flex items-center gap-2 uppercase tracking-wider">
        <ListChecks size={16} /> Cuentas e Historial
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
        <div>
          <label className="block text-xs font-medium text-gray-700">Cuentas Abiertas</label>
          <input 
            type="number"
            {...register("open_acc", { required: true, min: 0 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Total de Cuentas (Historial)</label>
          <input 
            type="number"
            {...register("total_acc", { required: true, min: 0 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Moras (últimos 2 años)</label>
          <input 
            type="number"
            {...register("delinq_2yrs", { required: true, min: 0 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Consultas (últimos 6 meses)</label>
          <input 
            type="number"
            {...register("inq_last_6mths", { required: true, min: 0 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Año del Primer Crédito</label>
          <input 
            type="number"
            {...register("earliest_cr_line_year", { required: true, min: 1950, max: 2026 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="Ej. 2010"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Saldo Total Actual</label>
          <input 
            type="number"
            {...register("tot_cur_bal", { required: true, min: 0 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          />
        </div>
      </div>
    </div>

    {/* 5.3 Cobranza y Registros Especiales */}
    <div className="border-t border-gray-100 pt-4 space-y-4">
      <h3 className="text-sm font-bold text-red-700 flex items-center gap-2 uppercase tracking-wider">
        <AlertTriangle size={16} /> Cobranza y Registros Especiales
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-xs font-medium text-gray-700">Monto en Cobranza (Collection)</label>
          <input 
            type="number"
            {...register("tot_coll_amt", { required: true, min: 0 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Cobros últimos 12 meses (No médicos)</label>
          <input 
            type="number"
            {...register("collections_12_mths_ex_med", { required: true, min: 0 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 bg-red-50 p-3 rounded-md">
        <ShieldAlert className="text-red-600" size={24} />
        <div className="flex-1">
          <p className="text-xs font-bold text-red-800">¿Existen Quitas o Recuperaciones en su historial?</p>
          <p className="text-[10px] text-red-600">Este campo (has_settlements) es un factor determinante para el modelo de riesgo.</p>
        </div>
        <input 
          type="checkbox"
          {...register("has_settlements")}
          className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
      </div>
    </div>
  </div>
);

export default Step5CreditHistory;