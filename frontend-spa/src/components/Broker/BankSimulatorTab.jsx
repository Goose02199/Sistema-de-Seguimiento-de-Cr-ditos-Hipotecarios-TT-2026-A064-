import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Landmark, RefreshCw, AlertCircle, CheckCircle2, SlidersHorizontal, 
  ChevronDown, ChevronUp, Maximize2, X, RotateCcw, PanelLeftClose, PanelRightOpen 
} from 'lucide-react';
import api from '../../api/api';

const BankSimulatorTab = ({ app }) => {
  const parseNum = (val, fallback = 0) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const formatCurrency = (value) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

  // 1. ESTADO INICIAL EXTRAÍDO (Para el botón de restablecer)
  const getInitialState = () => ({
    valor_vivienda: parseNum(app.property_value, 2500000),
    pct_enganche: parseNum(app.down_payment_pct, 10) / 100,
    plazo_anios: parseNum(app.loan_term, 20),
    ingreso_bruto: parseNum(app.annual_inc, 720000) / 12,
    tiene_infonavit: app.has_infonavit || false,
    tiene_fovissste: app.has_fovissste || false,
    subcuenta_vivienda: parseNum(app.housing_subaccount, 0),
    credito_instituto: parseNum(app.institute_credit_amount, 0)
  });

  const [simData, setSimData] = useState(getInitialState());
  const [results, setResults] = useState({ banorte: null, santander: null, scotiabank: null });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // ESTADO DE UI
  const [isParamsOpen, setIsParamsOpen] = useState(true);

  // MANEJADOR GLOBAL DE CAMBIOS
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSimData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : parseFloat(value) 
    }));
  };

  const handleReset = () => {
    setSimData(getInitialState());
  };

  // 3. EFECTO DEBOUNCE PARA LA API
  useEffect(() => {
    const fetchSimulations = async () => {
      setLoading(true);
      setErrors({});

      const payload = {
        usuario_perfil: {
          nombre: app.full_name || "Cliente",
          edad: 35, // Dato estático seguro
          sexo: "M",
          ingreso_bruto: simData.ingreso_bruto,
          valor_vivienda: simData.valor_vivienda,
          pct_enganche: simData.pct_enganche,
          plazo_meses: simData.plazo_anios * 12,
          tiene_infonavit: simData.tiene_infonavit,
          tiene_fovissste: simData.tiene_fovissste,
          infonavit: {
            subcuenta_vivienda: simData.subcuenta_vivienda,
            credito_infonavit: simData.credito_instituto
          },
          fovissste: {
            subcuenta_vivienda: simData.subcuenta_vivienda,
            credito_fovissste: simData.credito_instituto
          }
        }
      };

      try {
        const [resBanorte, resSantander, resScotia] = await Promise.allSettled([
          api.post('/mortgage/cotizar/banorte/', payload),
          api.post('/mortgage/cotizar/santander/', payload),
          api.post('/mortgage/cotizar/scotiabank/', payload) 
        ]);

        const newResults = { banorte: null, santander: null, scotiabank: null };
        const newErrors = {};

        if (resBanorte.status === 'fulfilled' && resBanorte.value.data.exito) {
          newResults.banorte = resBanorte.value.data.data_broker;
        } else {
          newErrors.banorte = resBanorte.reason?.response?.data?.error || "Sin opciones viables";
        }

        if (resSantander.status === 'fulfilled' && resSantander.value.data.exito) {
          newResults.santander = resSantander.value.data.data_broker;
        } else {
          newErrors.santander = resSantander.reason?.response?.data?.error || "Sin opciones viables";
        }

        if (resScotia.status === 'fulfilled' && resScotia.value.data.exito) {
          newResults.scotiabank = resScotia.value.data.data_broker;
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

    const delayDebounceFn = setTimeout(() => {
      fetchSimulations();
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [simData, app]);


  return (
    <div className={`grid grid-cols-1 ${isParamsOpen ? 'xl:grid-cols-4' : 'xl:grid-cols-1'} gap-6 animate-in fade-in duration-500`}>
      
      {/* PANEL DE CONTROLES CONTRAÍBLE */}
      {isParamsOpen && (
        <div className="xl:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit sticky top-6 animate-in slide-in-from-left-4 duration-300">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#1A4E5E]" /> Parámetros
            </h3>
            <div className="flex gap-1">
              <button 
                onClick={handleReset} 
                title="Restablecer valores del expediente"
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#1A4E5E] rounded-md transition-colors"
              >
                <RotateCcw size={16} />
              </button>
              <button 
                onClick={() => setIsParamsOpen(false)} 
                title="Ocultar panel"
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <SliderWithInput 
              label="Valor Inmueble" name="valor_vivienda" value={simData.valor_vivienda} 
              min={500000} max={25000000} step={50000} isCurrency onChange={handleChange} 
            />
            <SliderWithInput 
              label="Enganche" name="pct_enganche" value={simData.pct_enganche} 
              min={0.05} max={0.90} step={0.01} isPercentage onChange={handleChange} 
            />
            <SliderWithInput 
              label="Plazo (Años)" name="plazo_anios" value={simData.plazo_anios} 
              min={5} max={25} step={5} onChange={handleChange} 
            />
            <SliderWithInput 
              label="Ingreso Mensual" name="ingreso_bruto" value={simData.ingreso_bruto} 
              min={15000} max={500000} step={1000} isCurrency onChange={handleChange} 
            />

            <div className="pt-4 border-t border-slate-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Datos Institucionales</label>
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input type="checkbox" name="tiene_infonavit" checked={simData.tiene_infonavit} onChange={handleChange} className="accent-[#1A4E5E] w-4 h-4" />
                    Infonavit
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input type="checkbox" name="tiene_fovissste" checked={simData.tiene_fovissste} onChange={handleChange} className="accent-[#1A4E5E] w-4 h-4" />
                    Fovissste
                  </label>
                </div>
                {(simData.tiene_infonavit || simData.tiene_fovissste) && (
                  <div className="space-y-4 pt-2 border-t border-slate-200/50">
                    <SliderWithInput 
                      label="Subcuenta" name="subcuenta_vivienda" value={simData.subcuenta_vivienda} 
                      min={0} max={1500000} step={5000} isCurrency onChange={handleChange} 
                    />
                    <SliderWithInput 
                      label="Crédito Inst." name="credito_instituto" value={simData.credito_instituto} 
                      min={0} max={2500000} step={10000} isCurrency onChange={handleChange} 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-gray-400">
              <span>Monto a financiar (Banco):</span>
              <span className="text-[#1A4E5E] text-sm">{formatCurrency(simData.valor_vivienda * (1 - simData.pct_enganche))}</span>
            </div>
          </div>
        </div>
      )}

      {/* PANEL DE RESULTADOS */}
      <div className={`${isParamsOpen ? 'xl:col-span-3' : 'xl:col-span-4'} space-y-6 transition-all duration-300`}>
        
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            {!isParamsOpen && (
              <button 
                onClick={() => setIsParamsOpen(true)}
                className="p-2 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-[#1A4E5E] transition-colors shadow-sm mr-2"
                title="Mostrar parámetros"
              >
                <PanelRightOpen size={18} />
              </button>
            )}
            <div className={`p-2 rounded-full ${loading ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{loading ? 'Recalculando escenarios...' : 'Cotizaciones actualizadas'}</p>
              <p className="text-xs text-gray-500">Conectado a los motores deterministas bancarios.</p>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${isParamsOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
          <BankCard bankName="Banorte" themeColor="border-red-500" headerBg="bg-red-50" data={results.banorte} error={errors.banorte} loading={loading} />
          <BankCard bankName="Santander" themeColor="border-red-600" headerBg="bg-red-50" data={results.santander} error={errors.santander} loading={loading} />
          <BankCard bankName="Scotiabank" themeColor="border-red-700" headerBg="bg-red-50" data={results.scotiabank} error={errors.scotiabank} loading={loading} />
        </div>
      </div>
    </div>
  );
};

/* --- SUBCOMPONENTE DE CONTROL BIDIRECCIONAL CON VALIDACIÓN --- */

const SliderWithInput = ({ label, name, value, min, max, step, onChange, isPercentage = false, isCurrency = false }) => {
  // Estado local para permitir escritura libre antes de salir del campo
  const [localValue, setLocalValue] = useState(isPercentage ? (value * 100).toFixed(0) : value);

  // Sincronizar estado local si el valor principal cambia externamente
  useEffect(() => {
    setLocalValue(isPercentage ? (value * 100).toFixed(0) : value);
  }, [value, isPercentage]);

  const handleInputChange = (e) => {
    setLocalValue(e.target.value);
  };

  // Función crítica: Al salir del campo de texto, aplicamos límites (clamping)
  const handleBlur = () => {
    let parsed = parseFloat(localValue);
    if (isNaN(parsed)) parsed = isPercentage ? min * 100 : min;
    
    // Convertir porcentaje entero (ej. 20) a decimal (0.20)
    let finalValue = isPercentage ? parsed / 100 : parsed;
    
    // Aplicar Restricciones
    if (finalValue < min) finalValue = min;
    if (finalValue > max) finalValue = max;

    // Disparar evento al padre
    onChange({ target: { name, type: 'number', value: finalValue } });
    
    // Actualizar estado local corregido
    setLocalValue(isPercentage ? (finalValue * 100).toFixed(0) : finalValue);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
        
        {/* CAJA DE TEXTO EDITABLE */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus-within:ring-2 focus-within:ring-[#1A4E5E]/30 focus-within:border-[#1A4E5E]">
          {isCurrency && <span className="text-[10px] font-bold text-slate-400">$</span>}
          <input 
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            className="w-16 text-right text-xs font-black text-[#1A4E5E] bg-transparent outline-none p-0 border-none appearance-none"
          />
          {isPercentage && <span className="text-[10px] font-bold text-slate-400">%</span>}
        </div>
      </div>
      
      {/* BARRA DESLIZANTE SINCORNIZADA */}
      <input 
        type="range" name={name} min={min} max={max} step={step} value={value} onChange={onChange} 
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1A4E5E]"
      />
      <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1.5">
        <span>{isCurrency ? '$' : ''}{isPercentage ? `${(min*100).toFixed(0)}%` : min.toLocaleString()}</span>
        <span>{isCurrency ? '$' : ''}{isPercentage ? `${(max*100).toFixed(0)}%` : max.toLocaleString()}</span>
      </div>
    </div>
  );
};

/* --- EL RESTO DEL COMPONENTE BANKCARD SE QUEDA IGUAL --- */

const BankCard = ({ bankName, themeColor, headerBg, data, error, loading }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [data]);
  
  const activeScenario = data && data.length > 0 ? data[selectedIndex] : null;

  return (
    <>
      <div className={`bg-white border-t-4 ${themeColor} border-x border-b border-slate-200 rounded-b-2xl shadow-sm flex flex-col h-fit relative`}>
        <div className={`p-4 ${headerBg} border-b border-slate-100 flex justify-between items-center`}>
          <h4 className="font-black text-slate-800 tracking-tight">{bankName}</h4>
          <div className="flex items-center gap-2">
            {data && data.length > 1 && (
              <span className="text-[9px] font-bold bg-[#1A4E5E] text-white px-2 py-0.5 rounded-full">
                {data.length} opciones
              </span>
            )}
            <Landmark size={18} className="text-slate-400" />
          </div>
        </div>
        
        {data && data.length > 1 && !loading && !error && (
          <div className="px-5 pt-4 pb-2 border-b border-slate-50 bg-slate-50/50">
            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
              Seleccionar Escenario
            </label>
            <select 
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="w-full text-xs font-bold text-[#1A4E5E] bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#1A4E5E]/20 cursor-pointer shadow-sm"
            >
              {data.map((esc, idx) => (
                <option key={idx} value={idx}>
                  {esc['Nombre tasa'] || esc['Escenario / Banda'] || `Opción ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="p-5 flex flex-col justify-center">
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
          ) : activeScenario ? (
            <>
              <div className="space-y-4 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase line-clamp-1" title={activeScenario.Producto}>
                  {activeScenario.Producto}
                </p>
                
                <div className="py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Mensualidad</p>
                  <p className="text-3xl font-black text-slate-800">
                    {activeScenario['Mensualidad inicial'] || activeScenario['Mensualidad']}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Tasa Aplicada</p>
                    <p className="text-sm font-black text-[#1A4E5E]">{activeScenario.Tasa}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">CAT</p>
                    <p className="text-sm font-black text-rose-600">{activeScenario.CAT}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] bg-slate-800 text-white p-3 rounded-xl mt-4 shadow-md">
                  <span className="font-bold uppercase tracking-wider">Pago Inicial</span>
                  <span className="font-black text-sm">{activeScenario['Pago inicial']}</span>
                </div>
              </div>

              <button 
                onClick={() => setExpanded(true)}
                className="mt-5 w-full flex items-center justify-center gap-2 text-[10px] font-bold text-[#1A4E5E] bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2.5 rounded-xl transition-all"
              >
                <Maximize2 size={14} /> Ver Matriz Comparativa
              </button>
            </>
          ) : (
            <p className="text-xs text-center text-gray-400 italic">Esperando datos...</p>
          )}
        </div>
      </div>

      {expanded && data && !loading && !error && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className={`p-4 sm:p-6 flex justify-between items-center border-b border-slate-200 ${headerBg} shrink-0`}>
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Matriz de Escenarios: <span className="text-[#1A4E5E]">{bankName}</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Comparativa de {data.length} opciones calculadas para el perfil actual.
                </p>
              </div>
              <button 
                onClick={() => setExpanded(false)}
                className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors shadow-sm border border-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-auto flex-1 p-4 sm:p-6 custom-scrollbar bg-slate-50/30">
              <table className="w-full text-left border-collapse bg-white rounded-xl shadow-sm border border-slate-200">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 sm:p-4 text-xs uppercase font-black text-[#1A4E5E] sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Característica
                    </th>
                    {data.map((escenario, idx) => (
                      <th key={idx} className={`p-3 sm:p-4 text-xs uppercase font-bold whitespace-nowrap min-w-[140px] text-center border-l border-slate-100 ${idx === selectedIndex ? 'bg-blue-50/50 text-blue-700' : 'text-slate-600'}`}>
                        {escenario['Nombre tasa'] || escenario['Escenario / Banda'] || `Opción ${idx + 1}`}
                        {idx === selectedIndex && <span className="block text-[9px] mt-1 text-blue-500">(Seleccionado)</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700">
                  {Object.keys(activeScenario).map((key) => {
                    const keysToIgnore = ['Producto', 'Escenario / Banda', 'Nombre tasa', 'flujo_mensual'];
                    if (keysToIgnore.includes(key)) return null;

                    return (
                      <tr key={key} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-3 sm:p-4 font-bold text-slate-500 capitalize sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100">
                          {key.replace(/_/g, ' ')}
                        </td>
                        {data.map((escenario, idx) => (
                          <td key={idx} className={`p-3 sm:p-4 font-medium text-center border-l border-slate-100 ${idx === selectedIndex ? 'bg-blue-50/10' : ''}`}>
                            {escenario[key] !== null && escenario[key] !== undefined ? escenario[key] : '-'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right shrink-0">
              <button 
                onClick={() => setExpanded(false)}
                className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                Cerrar Matriz
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default BankSimulatorTab;