import React, { useEffect } from 'react';
import { 
  DollarSign, Receipt, CreditCard, ShieldCheck, 
  Percent, Info, AlertTriangle 
} from 'lucide-react';

const Step3Financial = ({ register, errors, watch, setValue }) => {
  const installment = watch("installment") || 0;
  const monthlyIncome = watch("monthly_income") || 0;
  const monthlyExpenses = watch("monthly_expenses") || 0;

  useEffect(() => {
    const income = parseFloat(monthlyIncome);
    const debts = parseFloat(installment);

    if (income > 0) {
      const dtiValue = (debts / income) * 100;
      setValue("dti", dtiValue.toFixed(2)); 
    } else {
      setValue("dti", 0);
    }
  }, [installment, monthlyIncome, setValue]);

  const currentDti = parseFloat(watch("dti")) || 0;

  // Componente Tooltip Reutilizable
  const InfoTooltip = ({ text }) => (
    <div className="group relative inline-block ml-1">
      <Info size={14} className="text-slate-400 cursor-help hover:text-[#1A4E5E] transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg z-50 leading-tight">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );

  // Lógica de Semáforo DTI
  const getDtiStatus = (val) => {
    if (val === 0) return { label: "Sin deudas", color: "text-green-600", bg: "bg-green-50" };
    if (val <= 30) return { label: "Excelente", color: "text-green-600", bg: "bg-green-50" };
    if (val <= 45) return { label: "Aceptable", color: "text-amber-600", bg: "bg-amber-50" };
    return { label: "Riesgo Alto", color: "text-red-600", bg: "bg-red-50" };
  };

  const dtiStatus = getDtiStatus(currentDti);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-4">
        <DollarSign className="text-[#1A4E5E]" /> Sección 3: Capacidad Financiera
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* Ingreso Mensual */}
        <div className="space-y-1">
          <label className="flex items-center text-sm font-bold text-gray-700">
            Ingreso Mensual Neto (MXN)
            <InfoTooltip text="Tu sueldo libre de impuestos. Si eres independiente, el promedio de tus últimos 6 meses." />
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">$</div>
            <input 
              type="number"
              {...register("monthly_income", { 
                required: "Campo obligatorio", 
                min: { value: 5000, message: "El ingreso mínimo debe ser de $5,000 MXN" }
              })}
              className={`block w-full pl-8 p-2.5 border rounded-xl focus:ring-2 focus:ring-[#1A4E5E] ${errors.monthly_income ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="0.00"
            />
          </div>
          {errors.monthly_income && <p className="text-red-500 text-[10px] font-bold italic">{errors.monthly_income.message}</p>}
        </div>

        {/* Gasto Mensual */}
        <div className="space-y-1">
          <label className="flex items-center text-sm font-bold text-gray-700">
            Gastos de Vida (MXN)
            <InfoTooltip text="Renta actual, despensa, servicios y entretenimiento." />
          </label>
          <div className="relative">
            <Receipt className="absolute left-3 top-3 text-gray-400" size={16} />
            <input 
              type="number"
              {...register("monthly_expenses", { 
                required: "Requerido",
                validate: v => parseFloat(v) < parseFloat(monthlyIncome) || "Tus gastos no pueden superar tus ingresos"
              })}
              className={`block w-full pl-10 p-2.5 border rounded-xl focus:ring-2 focus:ring-[#1A4E5E] ${errors.monthly_expenses ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="0.00"
            />
          </div>
          {errors.monthly_expenses && <p className="text-red-500 text-[10px] font-bold italic">{errors.monthly_expenses.message}</p>}
        </div>

        {/* Deudas Actuales */}
        <div className="space-y-1">
          <label className="flex items-center text-sm font-bold text-gray-700">
            Pago de Otras Deudas (MXN)
            <InfoTooltip text="Suma de mensualidades de tarjetas de crédito, préstamos de auto o personales." />
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 text-gray-400" size={16} />
            <input 
              type="number"
              {...register("installment", { required: "Si no tienes deudas, ingresa 0" })}
              className="block w-full pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E]"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Módulo DTI Informativo */}
        <div className="space-y-1">
          <label className="flex items-center text-sm font-bold text-gray-700">
            Nivel de Endeudamiento (DTI)
            <InfoTooltip text="Debt-to-Income Ratio. Porcentaje de tus ingresos destinado al pago de deudas. Idealmente debe ser menor al 40%." />
          </label>
          <div className={`p-2.5 rounded-xl border flex justify-between items-center transition-colors duration-500 ${dtiStatus.bg} ${dtiStatus.color.replace('text', 'border')}`}>
            <div className="flex items-center gap-2">
              <Percent size={18} className={dtiStatus.color} />
              <span className="text-lg font-black">{currentDti}%</span>
            </div>
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-white shadow-sm border ${dtiStatus.color}`}>
              {dtiStatus.label}
            </span>
          </div>
          <input type="hidden" {...register("dti")} />
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider text-right">Métrica predictiva de solvencia</p>
        </div>

        {/* Verificación */}
        <div className="md:col-span-2 space-y-1 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300">
          <label className="flex items-center text-sm font-bold text-slate-800">
            ¿Cómo comprobarás estos ingresos?
            <InfoTooltip text="Los bancos ofrecen mejores tasas si tus ingresos están totalmente timbrados (Nómina)." />
          </label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-3 text-[#1A4E5E]" size={20} />
            <select 
              {...register("verification_status", { required: "Selecciona un método" })}
              className="block w-full pl-11 p-3 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-[#1A4E5E] appearance-none"
            >
              <option value="not_verified">Declaración de palabra (Sin documentos aún)</option>
              <option value="source_verified">Estados de Cuenta Bancarios (Depósitos regulares)</option>
              <option value="verified">Recibos de Nómina CFDI (Ingreso comprobable)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerta si el DTI es muy alto */}
      {currentDti > 45 && (
        <div className="flex items-start gap-3 bg-red-50 p-3 rounded-xl border border-red-100 animate-bounce">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <p className="text-[11px] text-red-700 leading-tight">
            <strong>Atención:</strong> Tu nivel de deuda es muy alto. El bróker podría sugerir un monto de préstamo menor o requerir un co-acreditante.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step3Financial;