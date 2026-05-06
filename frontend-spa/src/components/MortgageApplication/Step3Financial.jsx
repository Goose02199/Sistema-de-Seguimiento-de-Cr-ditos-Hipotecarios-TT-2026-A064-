import React, { useEffect } from 'react';
import { DollarSign, Receipt, CreditCard, ShieldCheck, Percent } from 'lucide-react';

const Step3Financial = ({ register, errors, watch, setValue }) => {
  const installment = watch("installment");
  const monthlyIncome = watch("monthly_income");

  useEffect(() => {
    const income = parseFloat(monthlyIncome);
    const debts = parseFloat(installment);

    if (income > 0) {
      // El ratio DTI suele enviarse como porcentaje (0-100) para modelos como XGBoost
      const dtiValue = (debts / income) * 100;
      setValue("dti", dtiValue.toFixed(2)); 
    } else {
      setValue("dti", 0);
    }
  }, [installment, monthlyIncome, setValue]);

  const currentDti = watch("dti") || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <DollarSign className="text-[#1A4E5E]" /> Sección 3: Ingresos y Capacidad Financiera
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {/* Ingreso Mensual Neto */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Ingreso Mensual Neto (MXN)</label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="number"
              step="0.01"
              {...register("monthly_income", { required: "Dato crítico para el análisis", min: 1 })}
              className="block w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
              placeholder="Ej. 50000"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 italic">Se procesará como ingreso anual para el modelo.</p>
          {errors.monthly_income && <p className="text-red-500 text-[10px] mt-1">{errors.monthly_income.message}</p>}
        </div>

        {/* Gasto Mensual Aproximado */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Gasto Mensual Aproximado</label>
          <div className="relative mt-1">
            <Receipt className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="number"
              step="0.01"
              {...register("monthly_expenses", { required: "Dato requerido", min: 0 })}
              className="block w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
              placeholder="Ej. 15000"
            />
          </div>
        </div>

        {/* Pago de Otras Deudas */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Pago Mensual de Otras Deudas</label>
          <div className="relative mt-1">
            <CreditCard className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="number"
              step="0.01"
              {...register("installment", { required: "Dato requerido para el DTI", min: 0 })}
              className="block w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
              placeholder="Tarjetas, créditos auto, etc."
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 italic">Impacto directo en la probabilidad de aprobación.</p>
        </div>

        {/* Visualización de DTI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-bold flex items-center gap-1">
            Ratio Deuda/Ingreso (DTI) <Percent size={14} />
          </label>
          <div className={`mt-1 p-2 rounded-md border font-bold flex justify-between items-center ${
            currentDti > 40 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-100 border-slate-200 text-[#1A4E5E]'
          }`}>
            <span>{currentDti}%</span>
            <span className="text-[9px] uppercase tracking-tighter">
            </span>
          </div>
          <input type="hidden" {...register("dti")} />
          <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Variable Predictora: XGBoost</p>
        </div>

        {/* Verificación de Ingresos */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Estatus de Verificación de Ingresos</label>
          <div className="relative mt-1">
            <ShieldCheck className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <select 
              {...register("verification_status", { required: "Campo obligatorio" })}
              className="block w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E] bg-white"
            >
              <option value="not_verified">No verificado (Declaración simple)</option>
              <option value="source_verified">Fuente verificada (Estados de cuenta)</option>
              <option value="verified">Totalmente verificado (Recibos de nómina timbrados)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Financial;