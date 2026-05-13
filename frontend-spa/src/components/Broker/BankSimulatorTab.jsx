import React, { useState, useEffect } from 'react';
import { 
  Landmark, RefreshCw, AlertCircle, CheckCircle2, SlidersHorizontal
} from 'lucide-react';
import api from '../../api/api';

const BankSimulatorTab = ({ app }) => {
  // Aseguramos que los valores base sean números
  const parseNum = (val, fallback = 0) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const formatCurrency = (value) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

  // 1. ESTADO INICIAL BASADO EN EL EXPEDIENTE (app)
  const [simData, setSimData] = useState({
    valor_vivienda: parseNum(app.property_value, 2500000),
    pct_enganche: parseNum(app.down_payment_pct, 10) / 100, // Lo pasamos a decimal (ej. 0.10)
    plazo_anios: parseNum(app.loan_term, 20),
    ingreso_bruto: parseNum(app.annual_inc, 720000) / 12,
  });

  const [results, setResults] = useState({
    banorte: null,
    santander: null,
    scotiabank: null
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 2. MANEJADOR DE SLIDERS
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSimData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  // 3. EFECTO DEBOUNCE PARA LLAMAR A LA API
  useEffect(() => {
    const fetchSimulations = async () => {
      setLoading(true);
      setErrors({});

      const payload = {
        usuario_perfil: {
          nombre: app.full_name || "Cliente",
          edad: 35, // Idealmente extraído del perfil real
          sexo: "M",
          ingreso_bruto: simData.ingreso_bruto,
          valor_vivienda: simData.valor_vivienda,
          pct_enganche: simData.pct_enganche,
          plazo_meses: simData.plazo_anios * 12,
          tiene_infonavit: app.has_infonavit || false,
          tiene_fovissste: app.has_fovissste || false,
          infonavit: {
            subcuenta_vivienda: parseNum(app.housing_subaccount),
            credito_infonavit: parseNum(app.institute_credit_amount)
          },
          fovissste: {}
        }
      };

      try {
        // Ejecutamos las 3 llamadas en paralelo. allSettled evita que si un banco falla, se caigan los demás.
        const [resBanorte, resSantander, resScotia] = await Promise.allSettled([
          api.post('/mortgage/cotizar/banorte/', payload),
          api.post('/mortgage/cotizar/santander/', payload),
          api.post('/mortgage/cotizar/scotiabank/', payload)
        ]);

        const newResults = { banorte: null, santander: null, scotiabank: null };
        const newErrors = {};

        // Procesar Banorte
        if (resBanorte.status === 'fulfilled' && resBanorte.value.data.exito) {
          newResults.banorte = resBanorte.value.data.data_usuario[0];
        } else {
          newErrors.banorte = resBanorte.reason?.response?.data?.error || "Sin opciones viables";
        }

        // Procesar Santander
        if (resSantander.status === 'fulfilled' && resSantander.value.data.exito) {
          newResults.santander = resSantander.value.data.data_usuario[0];
        } else {
          newErrors.santander = resSantander.reason?.response?.data?.error || "Sin opciones viables";
        }

        // Procesar Scotiabank
        if (resScotia.status === 'fulfilled' && resScotia.value.data.exito) {
          newResults.scotiabank = resScotia.value.data.data_usuario[0];
        } else {
          newErrors.scotiabank = resScotia.reason?.response?.data?.error || "Sin opciones viables";
        }

        setResults(newResults);
        setErrors(newErrors);
      } catch (err) {
        console.error("Error global en simulación", err);
      } finally {
        setLoading(false);
      }
    };

    // Retrasar la llamada 800ms después del último movimiento del slider
    const delayDebounceFn = setTimeout(() => {
      fetchSimulations();
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [simData, app]);


  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
      
      {/* --- PANEL DE CONTROLES (IZQUIERDA) --- */}
      <div className="xl:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit sticky top-6">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6 flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-[#1A4E5E]" /> Parámetros
        </h3>

        <div className="space-y-6">
          <SliderControl 
            label="Valor Inmueble" 
            name="valor_vivienda" 
            value={simData.valor_vivienda} 
            min={500000} max={15000000} step={50000} 
            displayValue={formatCurrency(simData.valor_vivienda)} 
            onChange={handleChange} 
          />
          <SliderControl 
            label="Enganche (%)" 
            name="pct_enganche" 
            value={simData.pct_enganche} 
            min={0.05} max={0.50} step={0.01} 
            displayValue={`${(simData.pct_enganche * 100).toFixed(0)}%`} 
            onChange={handleChange} 
          />
          <SliderControl 
            label="Plazo (Años)" 
            name="plazo_anios" 
            value={simData.plazo_anios} 
            min={5} max={20} step={5} 
            displayValue={`${simData.plazo_anios} años`} 
            onChange={handleChange} 
          />
          <SliderControl 
            label="Ingreso Mensual Libre" 
            name="ingreso_bruto" 
            value={simData.ingreso_bruto} 
            min={15000} max={300000} step={1000} 
            displayValue={formatCurrency(simData.ingreso_bruto)} 
            onChange={handleChange} 
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-gray-400">
            <span>Monto a financiar:</span>
            <span className="text-[#1A4E5E]">{formatCurrency(simData.valor_vivienda * (1 - simData.pct_enganche))}</span>
          </div>
        </div>
      </div>

      {/* --- PANEL DE RESULTADOS (DERECHA) --- */}
      <div className="xl:col-span-3 space-y-6">
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${loading ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                {loading ? 'Recalculando escenarios...' : 'Cotizaciones actualizadas'}
              </p>
              <p className="text-xs text-gray-500">Conectado a los motores deterministas bancarios.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BankCard 
            bankName="Banorte" 
            themeColor="border-red-500" 
            headerBg="bg-red-50"
            data={results.banorte} 
            error={errors.banorte} 
            loading={loading} 
          />
          <BankCard 
            bankName="Santander" 
            themeColor="border-red-600" 
            headerBg="bg-red-50"
            data={results.santander} 
            error={errors.santander} 
            loading={loading} 
          />
          <BankCard 
            bankName="Scotiabank" 
            themeColor="border-red-700" 
            headerBg="bg-red-50"
            data={results.scotiabank} 
            error={errors.scotiabank} 
            loading={loading} 
          />
        </div>
      </div>
    </div>
  );
};

/* --- SUBCOMPONENTES --- */

const SliderControl = ({ label, name, value, min, max, step, displayValue, onChange }) => (
  <div>
    <div className="flex justify-between mb-2">
      <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
      <span className="text-xs font-black text-[#1A4E5E]">{displayValue}</span>
    </div>
    <input 
      type="range" 
      name={name} 
      min={min} 
      max={max} 
      step={step} 
      value={value} 
      onChange={onChange} 
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1A4E5E]"
    />
  </div>
);

const BankCard = ({ bankName, themeColor, headerBg, data, error, loading }) => {
  return (
    <div className={`bg-white border-t-4 ${themeColor} border-x border-b border-slate-200 rounded-b-2xl shadow-sm overflow-hidden flex flex-col`}>
      <div className={`p-4 ${headerBg} border-b border-slate-100 flex justify-between items-center`}>
        <h4 className="font-black text-slate-800 tracking-tight">{bankName}</h4>
        <Landmark size={18} className="text-slate-400" />
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
            <div className="h-10 bg-slate-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-slate-200 rounded w-full mt-4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
          </div>
        ) : error ? (
          <div className="text-center text-rose-500 py-6">
            <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold uppercase">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-4 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase line-clamp-1" title={data.Producto || data['Escenario / Banda']}>
              {data.Producto || data['Escenario / Banda']}
            </p>
            
            <div className="py-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Mensualidad</p>
              {/* Soporte para Scotiabank (Mensualidad inicial) o Banorte/Santander (Mensualidad) */}
              <p className="text-3xl font-black text-slate-800">
                {data['Mensualidad inicial'] || data['Mensualidad']}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Tasa Aplicada</p>
                <p className="text-sm font-black text-[#1A4E5E]">{data.Tasa}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">CAT</p>
                <p className="text-sm font-black text-rose-600">{data.CAT}</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] bg-slate-800 text-white p-3 rounded-xl mt-4">
              <span className="font-bold uppercase tracking-wider">Pago Inicial</span>
              <span className="font-black text-sm">{data['Pago inicial']}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-center text-gray-400 italic">Esperando datos...</p>
        )}
      </div>
    {data && !loading && (
        <div className="border-t border-slate-100 bg-slate-900 p-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> API Response
          </p>
          <pre className="text-[10px] text-green-400 font-mono overflow-auto max-h-40 custom-scrollbar leading-tight">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default BankSimulatorTab;