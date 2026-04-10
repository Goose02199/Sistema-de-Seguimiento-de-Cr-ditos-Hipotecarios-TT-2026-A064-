import React, { useEffect } from 'react';
import { Home, Percent, Landmark, PiggyBank, Calendar } from 'lucide-react';

const Step4Property = ({ register, errors, watch, setValue }) => {
  // Observamos valores para cálculo dinámico del Monto de Crédito 
  const propertyValue = watch("property_value");
  const downPaymentPct = watch("down_payment_pct");

  useEffect(() => {
    if (propertyValue && downPaymentPct) {
      const enganche = (propertyValue * downPaymentPct) / 100;
      const montoCredito = propertyValue - enganche;
      setValue("loan_amnt", montoCredito); // Cálculo automático 
    }
  }, [propertyValue, downPaymentPct, setValue]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Home className="text-[#1A4E5E]" /> Sección 4: Detalles del Crédito y Propiedad
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {/* Valor del Inmueble */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor del Inmueble (MXN)</label>
          <input 
            type="number"
            {...register("property_value", { required: "Requerido para el LTV", min: 1 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="Ej. 2500000"
          />
          {errors.property_value && <p className="text-red-500 text-xs mt-1">{errors.property_value.message}</p>}
        </div>

        {/* Porcentaje de Enganche */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Porcentaje de Enganche (%)</label>
          <div className="relative">
            <Percent className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="number"
              {...register("down_payment_pct", { required: true, min: 5, max: 90 })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Mínimo sugerido: 5%-10%.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {/* Monto Solicitado (Calculado) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-bold">Monto de Crédito Solicitado</label>
          <div className="mt-1 p-2 bg-slate-100 border border-slate-200 rounded-md text-[#1A4E5E] font-bold">
            $ {new Intl.NumberFormat().format(watch("loan_amnt") || 0)}
          </div>
          <input type="hidden" {...register("loan_amnt")} />
        </div>

        {/* Plazo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Plazo Deseado (Años)</label>
          <div className="relative">
            <Calendar className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <select 
              {...register("loan_term", { required: true })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E] appearance-none"
            >
              <option value="5">5 Años</option>
              <option value="10">10 Años</option>
              <option value="15">15 Años</option>
              <option value="20">20 Años</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {/* Tipo de Financiamiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Esquema de Financiamiento</label>
          <div className="relative">
            <Landmark className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <select 
              {...register("financing_type", { required: true })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E] appearance-none"
            >
              <option value="bancario">Bancario Puro</option>
              <option value="infonavit">Cofinavit (INFONAVIT)</option>
              <option value="fovissste">Fovissste para todos</option>
            </select>
          </div>
        </div>

        {/* Subcuenta de Vivienda */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Saldo Subcuenta Vivienda</label>
          <div className="relative">
            <PiggyBank className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="number"
              {...register("housing_subaccount")}
              className="mt-1 block w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
              placeholder="Ej. 150000"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Property;