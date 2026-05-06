import React, { useEffect } from 'react';
import { Home, Percent, Landmark, PiggyBank, Calendar, MapPin, BadgeDollarSign } from 'lucide-react';

const Step4Property = ({ register, errors, watch, setValue }) => {
  // Observamos valores para cálculos y lógica condicional
  const propertyValue = watch("property_value");
  const downPaymentPct = watch("down_payment_pct");
  const financingType = watch("financing_type");

  useEffect(() => {
    if (propertyValue && downPaymentPct) {
      const enganche = (propertyValue * downPaymentPct) / 100;
      const montoCredito = propertyValue - enganche;
      setValue("loan_amnt", montoCredito); 
    }
  }, [propertyValue, downPaymentPct, setValue]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Home className="text-[#1A4E5E]" /> Sección 4: Detalles del Crédito y Propiedad
      </h2>

      {/* Fila 1: Valor e Inversión Inicial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor del Inmueble (MXN)</label>
          <input 
            type="number"
            {...register("property_value", { required: "Requerido para el LTV", min: 1 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="Ej. 2500000"
          />
        </div>

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
        </div>
      </div>

      {/* Fila 2: Ubicación de la Propiedad (NUEVO) */}
      <div className="text-left">
        <label className="block text-sm font-medium text-gray-700">Ubicación de la Propiedad (Ciudad/Estado)</label>
        <div className="relative">
          <MapPin className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input 
            {...register("property_location", { required: "Dato necesario para valuación regional" })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="Ej. Querétaro, Qro o CDMX"
          />
        </div>
      </div>

      {/* Fila 3: Monto Calculado y Plazo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700 font-bold">Monto de Crédito Solicitado</label>
          <div className="mt-1 p-2 bg-slate-100 border border-slate-200 rounded-md text-[#1A4E5E] font-bold">
            $ {new Intl.NumberFormat().format(watch("loan_amnt") || 0)}
          </div>
          <input type="hidden" {...register("loan_amnt")} />
        </div>

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

      {/* Fila 4: Esquema y Subcuenta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
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

      {/* Fila 5: Crédito Institucional (NUEVO - Condicional) */}
      <div className={`text-left transition-all duration-300 ${financingType === 'bancario' ? 'opacity-50 grayscale' : 'opacity-100'}`}>
        <label className="block text-sm font-medium text-gray-700">
          Monto de Crédito del Instituto (Infonavit/Fovissste)
        </label>
        <div className="relative">
          <BadgeDollarSign className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="number"
            disabled={financingType === 'bancario'}
            {...register("institute_credit_amount")}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E] disabled:bg-gray-50"
            placeholder={financingType === 'bancario' ? "No aplica para crédito bancario" : "Ej. 450000"}
          />
        </div>
        {financingType !== 'bancario' && (
          <p className="text-[10px] text-blue-600 mt-1 font-bold uppercase tracking-tight">
            Este monto se sumará a tu capacidad de compra total.
          </p>
        )}
      </div>
    </div>
  );
};

export default Step4Property;