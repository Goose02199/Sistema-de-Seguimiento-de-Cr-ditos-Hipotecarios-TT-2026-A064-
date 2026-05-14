import React, { useEffect } from 'react';
import { 
  Home, Percent, Landmark, PiggyBank, Calendar, 
  MapPin, BadgeDollarSign, Info, AlertCircle 
} from 'lucide-react';

const Step4Property = ({ register, errors, watch, setValue }) => {
  const propertyValue = watch("property_value") || 0;
  const downPaymentPct = watch("down_payment_pct") || 10; // Default al 10%
  const financingType = watch("financing_type");
  const loanAmount = watch("loan_amnt") || 0;

  const ltv = 100 - downPaymentPct;

  useEffect(() => {
    if (propertyValue && downPaymentPct) {
      const enganche = (propertyValue * downPaymentPct) / 100;
      const montoCredito = propertyValue - enganche;
      setValue("loan_amnt", montoCredito); 
    }
  }, [propertyValue, downPaymentPct, setValue]);

  const InfoTooltip = ({ text }) => (
    <div className="group relative inline-block ml-1 text-left font-normal">
      <Info size={14} className="text-slate-400 cursor-help hover:text-[#1A4E5E]" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg z-50 leading-tight">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );

  const formatMoney = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-4">
        <Home className="text-[#1A4E5E]" /> Sección 4: Propiedad y Crédito
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* Valor Vivienda */}
        <div className="space-y-1">
          <label className="flex items-center text-sm font-bold text-gray-700">
            Valor del Inmueble (MXN)
            <InfoTooltip text="El precio de venta. Este valor será validado posteriormente mediante un avalúo certificado." />
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">$</div>
            <input 
              type="number"
              {...register("property_value", { 
                required: "Requerido", 
                min: { value: 500000, message: "Mínimo $500,000" } 
              })}
              className={`block w-full pl-8 p-2.5 border rounded-xl focus:ring-2 focus:ring-[#1A4E5E] ${errors.property_value ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="2,500,000"
            />
          </div>
          {errors.property_value && <p className="text-red-500 text-[10px] font-bold italic">{errors.property_value.message}</p>}
        </div>

        {/* Enganche */}
        <div className="space-y-1">
          <label className="flex items-center text-sm font-bold text-gray-700">
            Enganche (%)
            <InfoTooltip text="La banca tradicional en México requiere un mínimo del 10% de enganche." />
          </label>
          <div className="relative">
            <Percent className="absolute right-3 top-3 text-gray-400" size={16} />
            <input 
              type="number"
              {...register("down_payment_pct", { 
                required: "Requerido", 
                min: { value: 10, message: "El enganche mínimo es del 10%" },
                max: { value: 90, message: "Máximo 90%" }
              })}
              className={`block w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-[#1A4E5E] ${errors.down_payment_pct ? 'border-red-500' : 'border-gray-200'}`}
            />
          </div>
          {errors.down_payment_pct && <p className="text-red-500 text-[10px] font-bold italic">{errors.down_payment_pct.message}</p>}
        </div>

        {/* Ubicación */}
        <div className="md:col-span-2 space-y-1">
          <label className="flex items-center text-sm font-bold text-gray-700">Ubicación (Ciudad/Estado)</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              {...register("property_location", { required: "Campo obligatorio" })}
              className="block w-full pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A4E5E]"
              placeholder="Ej. Querétaro, Qro."
            />
          </div>
        </div>

        {/* Monto de Crédito Visual */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-[#1A4E5E]">Crédito Solicitado al Banco</label>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[#1A4E5E] font-black text-lg">
            {formatMoney(loanAmount)}
          </div>
          <p className="text-[9px] uppercase font-bold text-slate-400 italic">Loan-to-Value (LTV): {ltv}%</p>
          <input type="hidden" {...register("loan_amnt")} />
        </div>

        {/* Plazo */}
        <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700">Plazo Deseado</label>
          <div className="relative">
            <Calendar className="absolute right-3 top-3 text-gray-400" size={18} />
            <select 
              {...register("loan_term", { required: true })}
              className="block w-full p-2.5 border border-gray-200 rounded-xl bg-white appearance-none"
            >
              <option value="5">5 Años</option>
              <option value="10">10 Años</option>
              <option value="15">15 Años</option>
              <option value="20">20 Años</option>
            </select>
          </div>
        </div>

        {/* Esquema Financiamiento */}
        <div className="space-y-1">
          <label className="block text-sm font-bold text-gray-700">Esquema</label>
          <select 
            {...register("financing_type", { required: true })}
            className="block w-full p-2.5 border border-gray-200 rounded-xl bg-white appearance-none"
          >
            <option value="bancario">Bancario Puro</option>
            <option value="infonavit">Cofinavit</option>
            <option value="fovissste">Fovissste para todos</option>
          </select>
        </div>

        {/* Saldo Subcuenta */}
        <div className="space-y-1">
          <label className="flex items-center text-sm font-bold text-gray-700">
            Saldo Subcuenta Vivienda
            <InfoTooltip text="Dinero acumulado en tu cuenta del instituto que puedes usar para el enganche o gastos." />
          </label>
          <div className="relative">
            <PiggyBank className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="number"
              {...register("housing_subaccount")}
              className={`block w-full pl-10 p-2.5 border rounded-xl ${financingType !== 'bancario' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Banner de LTV dinámico */}
      {ltv >= 90 ? (
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <AlertCircle className="text-slate-500 shrink-0" size={20} />
          <p className="text-[11px] text-slate-600 leading-tight">
            <strong>Información:</strong> Estás solicitando el financiamiento máximo permitido (90%). Un enganche mayor al 10% podría ayudarte a obtener una mejor tasa de interés.
          </p>
        </div>
      ) : ltv > 80 ? (
        <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
          <Info className="text-blue-500 shrink-0" size={20} />
          <p className="text-[11px] text-blue-700 leading-tight">
            <strong>Buen perfil:</strong> Tu nivel de financiamiento es equilibrado. Esto suele facilitar la aprobación en la mayoría de los bancos.
          </p>
        </div>
      ) : null}

      {/* Campo condicional para crédito de institutos */}
      {financingType !== 'bancario' && (
        <div className="mt-4 p-4 bg-[#1A4E5E]/5 border-2 border-dashed border-[#1A4E5E]/20 rounded-2xl animate-in zoom-in-95 duration-300">
          <label className="block text-sm font-bold text-[#1A4E5E] mb-2 uppercase tracking-wider text-left">Monto de Crédito del Instituto</label>
          <div className="relative">
            <BadgeDollarSign className="absolute left-3 top-3 text-[#1A4E5E]" size={20} />
            <input 
              type="number"
              {...register("institute_credit_amount", { required: financingType !== 'bancario' })}
              className="w-full pl-11 p-3 border border-[#1A4E5E]/20 rounded-xl focus:ring-2 focus:ring-[#1A4E5E]"
              placeholder="Ej. 450000"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Step4Property;