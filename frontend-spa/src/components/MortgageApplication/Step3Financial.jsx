import React from 'react';
import { DollarSign, Receipt, CreditCard, ShieldCheck } from 'lucide-react';

const Step3Financial = ({ register, errors }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
      <DollarSign className="text-[#1A4E5E]" /> Sección 3: Ingresos y Capacidad Financiera
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      {/* Ingreso Mensual Neto */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Ingreso Mensual Neto (MXN)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="number"
            {...register("monthly_income", { required: "Dato crítico para el análisis", min: 1 })}
            className="mt-1 block w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="Ej. 50000"
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Se multiplicará por 12 para el modelo de riesgo. [cite: 30]</p>
        {errors.monthly_income && <p className="text-red-500 text-xs mt-1">{errors.monthly_income.message}</p>}
      </div>

      {/* Gasto Mensual Aproximado */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Gasto Mensual Aproximado</label>
        <div className="relative">
          <Receipt className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="number"
            {...register("monthly_expenses", { required: "Dato requerido", min: 0 })}
            className="mt-1 block w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="Ej. 15000"
          />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      {/* Pago de Otras Deudas (Installment) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Pago Mensual de Otras Deudas</label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="number"
            {...register("installment", { required: "Dato requerido para el DTI", min: 0 })}
            className="mt-1 block w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="Tarjetas, créditos auto, etc."
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Fundamental para el cálculo de deuda/ingreso. [cite: 31]</p>
      </div>

      {/* Verificación de Ingresos */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Fuente de Verificación</label>
        <div className="relative">
          <ShieldCheck className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <select 
            {...register("verification_status", { required: "Seleccione el estatus de sus comprobantes" })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E] appearance-none"
          >
            <option value="not_verified">No verificado</option>
            <option value="source_verified">Fuente verificada</option>
            <option value="verified">Verificado</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);

export default Step3Financial;