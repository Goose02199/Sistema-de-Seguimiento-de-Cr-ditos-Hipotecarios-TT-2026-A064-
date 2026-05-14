import React from 'react';
import { 
  History, BarChart3, ListChecks, AlertTriangle, 
  ShieldAlert, Gavel, Scale, Coins, Info, CalendarClock
} from 'lucide-react';

const Step5CreditHistory = ({ register, errors, watch }) => {
  const hasSettlements = watch("has_settlements");

  // Componente Tooltip para explicaciones largas
  const InfoTooltip = ({ title, text }) => (
    <div className="group relative inline-block ml-1">
      <Info size={14} className="text-slate-400 cursor-help hover:text-[#1A4E5E] transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl z-50 leading-relaxed border border-slate-600 font-normal">
        <p className="font-bold border-b border-slate-600 mb-1 pb-1 uppercase text-[#5eead4]">{title}</p>
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-4">
        <History className="text-[#1A4E5E]" /> Sección 5: Historial en Buró de Crédito
      </h2>

      {/* 5.1 Saldos y Límites Revolventes */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-sm font-black text-[#1A4E5E] flex items-center gap-2 uppercase tracking-widest">
          <BarChart3 size={18} /> Créditos Revolventes (Tarjetas)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div>
            <label className="flex items-center text-[11px] font-bold text-gray-700 uppercase">
              Saldo Revolvente
              <InfoTooltip 
                title="Saldo Revolvente" 
                text="Es la suma de lo que debes actualmente en todas tus tarjetas de crédito y líneas de crédito abiertas." 
              />
            </label>
            <input 
              type="number"
              {...register("revol_bal", { required: "Requerido", min: 0 })}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A4E5E]"
              placeholder="Ej. 15000"
            />
          </div>
          <div>
            <label className="flex items-center text-[11px] font-bold text-gray-700 uppercase">
              Límite de Crédito
              <InfoTooltip 
                title="Límite Total" 
                text="La suma de los límites máximos de todas tus tarjetas de crédito, sin importar cuánto hayas gastado." 
              />
            </label>
            <input 
              type="number"
              {...register("total_rev_hi_lim", { required: "Requerido", min: 0 })}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A4E5E]"
              placeholder="Ej. 50000"
            />
          </div>
          <div>
            <label className="flex items-center text-[11px] font-bold text-gray-700 uppercase">
              % Utilización
              <InfoTooltip 
                title="Ratio de Utilización" 
                text="Porcentaje de tus líneas de crédito que estás usando. Lo ideal para un crédito hipotecario es mantenerlo debajo del 30%." 
              />
            </label>
            <div className="relative">
              <input 
                type="number"
                step="0.01"
                {...register("revol_util", { required: "Requerido", min: 0, max: 100 })}
                className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A4E5E]"
                placeholder="Ej. 25.5"
              />
              <span className="absolute right-3 top-3 text-gray-400 text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5.2 Cuentas e Historial */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-black text-[#1A4E5E] flex items-center gap-2 uppercase tracking-widest">
          <ListChecks size={18} /> Comportamiento y Experiencia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          <div>
            <label className="flex items-center text-[11px] font-bold text-gray-700 uppercase">
              Cuentas Abiertas
              <InfoTooltip title="Open Accounts" text="Número de créditos que tienes activos actualmente (tarjetas, auto, préstamos, telefonía)." />
            </label>
            <input 
              type="number"
              {...register("open_acc", { required: "Requerido", min: 0 })}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl"
              placeholder="Ej. 4"
            />
          </div>
          <div>
            <label className="flex items-center text-[11px] font-bold text-gray-700 uppercase">
              Moras (2 años)
              <InfoTooltip title="Delinquency" text="Número de veces que te has retrasado más de 30 días en tus pagos en los últimos 24 meses." />
            </label>
            <input 
              type="number"
              {...register("delinq_2yrs", { required: "Requerido", min: 0 })}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl"
              placeholder="Ej. 0"
            />
          </div>
          <div>
            <label className="flex items-center text-[11px] font-bold text-gray-700 uppercase">
              Año 1er Crédito
              <InfoTooltip title="Credit Age" text="Año en que sacaste tu primer crédito (puede ser una tarjeta de tienda departamental o plan celular)." />
            </label>
            <div className="relative">
                <CalendarClock className="absolute right-3 top-3 text-gray-400" size={16} />
                <input 
                type="number"
                {...register("earliest_cr_line_year", { 
                    required: "Requerido", 
                    min: 1960, 
                    max: new Date().getFullYear() 
                })}
                className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl"
                placeholder="AAAA"
                />
            </div>
          </div>
          <div>
            <label className="flex items-center text-[11px] font-bold text-gray-700 uppercase">
              Consultas (6m)
              <InfoTooltip title="Inquiries" text="Veces que has solicitado crédito en los últimos 6 meses. Muchas consultas pueden bajar tu Score temporalmente." />
            </label>
            <input 
              type="number"
              {...register("inq_last_6mths", { required: "Requerido", min: 0 })}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl"
              placeholder="Ej. 2"
            />
          </div>
          <div>
            <label className="flex items-center text-[11px] font-bold text-gray-700 uppercase">
              Registros Públicos
              <InfoTooltip title="Public Records" text="Número de juicios mercantiles, quiebras o embargos legales que aparezcan en tu historial." />
            </label>
            <div className="relative">
              <Gavel className="absolute right-3 top-3 text-gray-400" size={16} />
              <input 
                type="number"
                {...register("pub_rec", { required: true, min: 0 })}
                className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl"
                placeholder="Ej. 0"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center text-[11px] font-bold text-gray-700 uppercase">
              Saldo Total Actual
              <InfoTooltip title="Total Balance" text="Suma de absolutamente todas tus deudas vigentes, incluyendo hipotecas previas o créditos de auto." />
            </label>
            <input 
              type="number"
              {...register("tot_cur_bal", { required: "Requerido", min: 0 })}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl"
              placeholder="Ej. 450000"
            />
          </div>
        </div>
      </div>

      {/* 5.3 Cobranza y Alertas Críticas */}
      <div className="border-t border-red-100 pt-6 space-y-4">
        <h3 className="text-sm font-black text-red-700 flex items-center gap-2 uppercase tracking-widest">
          <AlertTriangle size={18} /> Alertas de Riesgo y Cobranza
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
            <label className="block text-[11px] font-bold text-red-800 uppercase">Monto Total en Cobranza</label>
            <input 
              type="number"
              {...register("tot_coll_amt", { required: true, min: 0 })}
              className="mt-1 block w-full p-2.5 border border-red-200 rounded-xl focus:ring-red-500"
              placeholder="Deuda cedida a despachos"
            />
          </div>
          <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
            <label className="block text-[11px] font-bold text-red-800 uppercase">Cobros últimos 12 meses</label>
            <input 
              type="number"
              {...register("collections_12_mths_ex_med", { required: true, min: 0 })}
              className="mt-1 block w-full p-2.5 border border-red-200 rounded-xl focus:ring-red-500"
              placeholder="Número de incidencias"
            />
          </div>
        </div>

        {/* MÓDULO DE QUITAS (Dato más sensible para Bancos) */}
        <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${hasSettlements ? 'bg-red-100 border-red-400 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${hasSettlements ? 'bg-red-600 text-white' : 'bg-slate-300 text-slate-500'}`}>
                <ShieldAlert size={28} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-slate-800 uppercase">¿Has pagado créditos con "Quita"?</p>
              <p className="text-[11px] text-slate-600 leading-tight">
                Una **Quita** es un acuerdo donde pagas solo una parte de la deuda y el banco condona el resto. Esto deja una marca negativa (MOP-97) en Buró por 6 años.
              </p>
            </div>
            <input 
              type="checkbox"
              {...register("has_settlements")}
              className="w-7 h-7 text-red-600 border-slate-300 rounded-xl focus:ring-red-500 cursor-pointer"
            />
          </div>

          {hasSettlements && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-white/60 rounded-xl animate-in slide-in-from-top-4 duration-500">
              <div className="text-left">
                <label className="block text-[10px] font-bold text-red-700 uppercase">Número de Quitas</label>
                <div className="relative mt-1">
                  <Scale className="absolute right-3 top-2.5 text-red-300" size={16} />
                  <input 
                    type="number"
                    {...register("settlement_count")}
                    className="block w-full p-2.5 border border-red-200 rounded-xl text-red-900 focus:ring-red-500"
                    placeholder="Ej. 1"
                  />
                </div>
              </div>
              <div className="text-left">
                <label className="block text-[10px] font-bold text-red-700 uppercase">Monto Total Condonado</label>
                <div className="relative mt-1">
                  <Coins className="absolute right-3 top-2.5 text-red-300" size={16} />
                  <input 
                    type="number"
                    {...register("settlement_amount")}
                    className="block w-full p-2.5 border border-red-200 rounded-xl text-red-900 focus:ring-red-500"
                    placeholder="Ej. 35000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step5CreditHistory;