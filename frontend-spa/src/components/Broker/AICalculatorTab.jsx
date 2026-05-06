import React, { useState, useEffect } from 'react';
import { 
  Cpu, PieChart, RefreshCw, AlertTriangle, 
  Calculator, Info, RotateCcw, Download
} from 'lucide-react';
import api from '../../api/api';

const AICalculatorTab = ({ app }) => {
  // Función para asegurar que los valores sean números reales al inicializar
  const parseNum = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const initialState = {
    loan_amnt: parseNum(app.loan_amnt),
    monthly_income: parseNum(app.annual_inc) / 12,
    installment: parseNum(app.installment),
    revol_bal: parseNum(app.revol_bal),
    tot_cur_bal: parseNum(app.tot_cur_bal),
    tot_coll_amt: parseNum(app.tot_coll_amt),
    total_rev_hi_lim: parseNum(app.total_rev_hi_lim),
    verification_status: app.verification_status,
    dti: parseNum(app.dti),
    delinq_2yrs: parseNum(app.delinq_2yrs),
    inq_last_6mths: parseNum(app.inq_last_6mths),
    open_acc: parseNum(app.open_acc),
    pub_rec: parseNum(app.pub_rec),
    total_acc: parseNum(app.total_acc),
    revol_util: parseNum(app.revol_util),
    home_ownership: app.home_ownership,
    earliest_cr_line: parseInt(app.earliest_cr_line_year),
    property_value: parseNum(app.property_value),
    loan_term: parseInt(app.loan_term)
  };

  const [simData, setSimData] = useState(initialState);
  const [results, setResults] = useState({ risk: null, rec: null });
  const [loading, setLoading] = useState(false);
  const [isJsonExpanded, setIsJsonExpanded] = useState(false);

  // Resetear a valores originales
  const handleReset = () => {
    setSimData(initialState);
    setResults({ risk: null, rec: null });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSimData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const riskPayload = {
        loan_amnt_MXN2025: parseNum(simData.loan_amnt),
        annual_inc_MXN2025: parseNum(simData.monthly_income) * 12,
        installment_MXN2025: parseNum(simData.installment),
        revol_bal_MXN2025: parseNum(simData.revol_bal),
        tot_cur_bal_MXN2025: parseNum(simData.tot_cur_bal),
        tot_coll_amt_MXN2025: parseNum(simData.tot_coll_amt),
        total_rev_hi_lim_MXN2025: parseNum(simData.total_rev_hi_lim),
        dti: parseNum(simData.dti),
        revol_util: parseNum(simData.revol_util),
        delinq_2yrs: parseInt(simData.delinq_2yrs),
        inq_last_6mths: parseInt(simData.inq_last_6mths),
        open_acc: parseInt(simData.open_acc),
        pub_rec: parseInt(simData.pub_rec),
        total_acc: parseInt(simData.total_acc),
        earliest_cr_line: parseInt(simData.earliest_cr_line),
        verification_status: simData.verification_status,
        home_ownership: simData.home_ownership
      };

      const recPayload = {
        monto_credito: parseNum(simData.loan_amnt),
        plazo_anios: parseInt(simData.loan_term),
        ingreso_mensual: parseNum(simData.monthly_income),
        valor_vivienda: parseNum(simData.property_value)
      };

      const [riskRes, recRes] = await Promise.all([
        api.post('/mortgage/analyze-risk/', riskPayload),
        api.post('/mortgage/recommend-banks/', recPayload)
      ]);

      setResults({ risk: riskRes.data, rec: recRes.data });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estilos específicos para el reporte PDF */}
      {/* Estilos específicos para el reporte PDF */}
      {/* Estilos específicos para el reporte PDF */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Ocultar el encabezado del reporte en la pantalla normal */
        .print-only-sim { display: none !important; }

        @media print {
            /* 1. OCULTACIÓN AGRESIVA DE LA APP PADRE */
            nav, aside, header, footer, .sidebar, .no-print-sim,
            .flex.border-b, 
            .flex.flex-col.md\\:flex-row.justify-between { 
              display: none !important; 
            }

            /* 2. RESET DE CONTENEDORES Y ELIMINAR SCROLLBARS */
            * {
              overflow: visible !important;
              max-height: none !important;
            }
            
            html, body, #root, .app-layout, main, .space-y-6 {
              height: auto !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              box-shadow: none !important;
            }

            /* 3. FORMATO DEL ENCABEZADO */
            .print-only-sim { 
              display: flex !important; 
              flex-direction: column !important;
              align-items: center !important;
              margin-bottom: 10px !important;
              padding-bottom: 10px !important;
              border-bottom: 2px solid #1A4E5E !important;
            }

            /* 4. FORZAR COLUMNAS PARA ELIMINAR ESPACIO EN BLANCO */
            /* Forzar 3 columnas principales (Crédito, Ingreso, Buró) */
            .md\\:grid-cols-3 { 
              display: grid !important; 
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important; 
              gap: 15px !important; 
            }
            
            /* Forzar 2 columnas internas dentro de Buró */
            .grid-cols-2 {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 5px !important;
            }
            
            /* Separar contenedores principales */
            .xl\\:grid-cols-4 { 
              display: block !important; 
            }
            .xl\\:col-span-3 { 
              width: 100% !important; 
              margin-bottom: 15px !important;
            }

            /* 5. REDUCIR MÁRGENES Y SEPARACIONES (COMPRESIÓN) */
            .space-y-6 > * + * { margin-top: 10px !important; }
            .space-y-4 > * + * { margin-top: 5px !important; }
            .p-6 { padding: 10px !important; }
            .mb-6 { margin-bottom: 10px !important; }
            .mb-4 { margin-bottom: 5px !important; }

            /* 6. COMPACTAR INPUTS Y TEXTOS */
            label {
              font-size: 7.5pt !important;
              margin-bottom: 0 !important;
            }
            input, select {
              border: none !important;
              background: transparent !important;
              padding: 0 !important;
              margin-top: -2px !important; /* Acerca el valor al título */
              font-weight: bold !important;
              font-size: 9pt !important;
              color: #1A4E5E !important;
              appearance: none !important;
              -webkit-appearance: none !important;
              height: auto !important;
            }

            /* 7. FORMATO PARA EL JSON DE RESULTADOS (Más pequeño) */
            pre {
              white-space: pre-wrap !important;
              word-wrap: break-word !important; 
              background: transparent !important;
              color: #334155 !important;
              border: none !important;
              font-size: 7pt !important;
              line-height: 1.2 !important;
              padding: 0 !important;
            }
            
            .bg-slate-900 {
              background: transparent !important;
              padding: 0 !important;
            }

            /* 8. PREVENIR CORTES Y CONFIGURAR PÁGINA */
            .bg-white, .space-y-4 { 
              page-break-inside: avoid !important; 
              break-inside: avoid !important;
            }

            @page {
              margin: 1cm; /* Achicamos los márgenes de la hoja */
            }
        }
        `}} />
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Calculator className="text-blue-600" /> Simulador de Escenarios
                </h3>
                <div className="flex gap-2 no-print-sim"> {/* Añadimos no-print-sim aquí */}
                    <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 font-bold transition-all border border-gray-200 rounded-xl">
                    <RotateCcw size={18} /> Reset
                    </button>
                    
                    {/* NUEVO BOTÓN DE PDF */}
                    <button 
                    onClick={handleDownloadPDF} 
                    className="flex items-center gap-2 px-4 py-2 text-[#1A4E5E] hover:bg-slate-50 font-bold transition-all border border-[#1A4E5E] rounded-xl"
                    >
                    <Download size={18} /> Exportar PDF
                    </button>

                    <button 
                    onClick={runSimulation}
                    disabled={loading}
                    className="bg-[#1A4E5E] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#133a46] transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />} 
                    Simular
                    </button>
                </div>
            </div>

            {/* ENCABEZADO EXCLUSIVO PARA EL PDF */}
            <div className="print-only-sim text-center mb-8 border-b pb-4">
                <h1 className="text-xl font-bold uppercase">Reporte de Simulación Hipotecaria</h1>
                <p className="text-sm text-gray-500">Cliente: {app.full_name} | Folio: #{app.id}</p>
                <p className="text-[10px] text-gray-400">Fecha de Simulación: {new Date().toLocaleString()}</p>
            </div>
            
            

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-l-2 border-blue-600 pl-2">Crédito y Vivienda</h4>
                <SimField label="Monto Solicitado" name="loan_amnt" value={simData.loan_amnt} onChange={handleChange} />
                <SimField label="Valor Vivienda" name="property_value" value={simData.property_value} onChange={handleChange} />
                <SimField label="Plazo (Años)" name="loan_term" value={simData.loan_term} onChange={handleChange} />
                <SimSelect label="Vivienda" name="home_ownership" value={simData.home_ownership} onChange={handleChange} options={["RENT", "OWN", "MORTGAGE", "ANY", "OTHER", "NONE"]} />
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest border-l-2 border-green-600 pl-2">Ingresos y Deuda</h4>
                <SimField label="Ingreso Mensual" name="monthly_income" value={simData.monthly_income} onChange={handleChange} />
                <SimField label="Pago Otras Deudas" name="installment" value={simData.installment} onChange={handleChange} />
                <SimField label="DTI (%)" name="dti" value={simData.dti} onChange={handleChange} />
                <SimSelect label="Verificación" name="verification_status" value={simData.verification_status} onChange={handleChange} options={["not_verified", "source_verified", "verified"]} />
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest border-l-2 border-purple-600 pl-2">Buró de Crédito</h4>
                <div className="grid grid-cols-2 gap-2">
                  <SimField label="Saldo Rev." name="revol_bal" value={simData.revol_bal} onChange={handleChange} />
                  <SimField label="Límite" name="total_rev_hi_lim" value={simData.total_rev_hi_lim} onChange={handleChange} />
                  <SimField label="Utilización (%)" name="revol_util" value={simData.revol_util} onChange={handleChange} />
                  <SimField label="Moras (2a)" name="delinq_2yrs" value={simData.delinq_2yrs} onChange={handleChange} />
                  <SimField label="Consultas" name="inq_last_6mths" value={simData.inq_last_6mths} onChange={handleChange} />
                  <SimField label="Cuentas Ab." name="open_acc" value={simData.open_acc} onChange={handleChange} />
                  <SimField label="Reg. Públicos" name="pub_rec" value={simData.pub_rec} onChange={handleChange} />
                  <SimField label="Total Cuentas" name="total_acc" value={simData.total_acc} onChange={handleChange} />
                  <SimField label="1er Crédito" name="earliest_cr_line" value={simData.earliest_cr_line} onChange={handleChange} />
                  <SimField label="Saldo Total" name="tot_cur_bal" value={simData.tot_cur_bal} onChange={handleChange} />
                </div>
                <SimField label="Cobranza" name="tot_coll_amt" value={simData.tot_coll_amt} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm min-h-[300px]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Cpu size={14} className="text-purple-600" /> Riesgo XGBoost
            </h3>
            {results.risk ? (
              <div className="space-y-4 text-center">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Resultado</p>
                  <p className="text-2xl font-black text-[#1A4E5E] leading-tight">
                    {results.risk.risk_label || results.risk.label || "Sin Etiqueta"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Score</p>
                  <p className="text-5xl font-black text-purple-700">{results.risk.risk_score}</p>
                </div>
                <div className="text-left space-y-2 border-t pt-4">
                   <p className="text-[10px] font-bold text-gray-400 uppercase">Probabilidades</p>
                   <ProbBar label="Bajo" value={results.risk.probabilities?.bajo} color="bg-green-500" />
         <ProbBar label="Medio" value={results.risk.probabilities?.medio} color="bg-yellow-500" />
         <ProbBar label="Alto" value={results.risk.probabilities?.alto} color="bg-red-500" />
                </div>
              </div>
            ) : <EmptyState text="Simula para ver el riesgo." />}
          </div>

          <div className={`bg-white border rounded-2xl p-6 shadow-sm transition-all duration-300 ${isJsonExpanded ? 'fixed inset-4 z-50 overflow-hidden' : 'relative overflow-hidden'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <PieChart size={14} className="text-blue-600" /> JSON Rec.
                </h3>
                {results.rec && (
                <button 
                    onClick={() => setIsJsonExpanded(!isJsonExpanded)}
                    className="text-[10px] font-bold text-blue-600 hover:underline no-print-sim"
                >
                    {isJsonExpanded ? 'Contraer Vista' : 'Ampliar Vista'}
                </button>
                )}
            </div>

            {results.rec ? (
                <div className={`bg-slate-900 rounded-xl p-3 overflow-auto transition-all ${isJsonExpanded ? 'h-[calc(100%-40px)]' : 'max-h-[300px]'}`}>
                    <pre className={`text-blue-400 font-mono leading-tight transition-all duration-300 ${
                        isJsonExpanded ? 'text-sm p-4' : 'text-[9px] p-0'
                        }`}>
                        {JSON.stringify(results.rec, null, 2)}
                    </pre>
                </div>
            ) : <EmptyState text="Simula para ver el Top 5." />}

            {/* Overlay para cerrar al hacer clic afuera si está expandido */}
            {isJsonExpanded && (
                <div 
                className="fixed inset-0 bg-black/20 -z-10 no-print-sim" 
                onClick={() => setIsJsonExpanded(false)} 
                />
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

/* --- SUBCOMPONENTES --- */
const SimField = ({ label, name, value, onChange }) => (
  <div>
    <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
    <input type="number" name={name} value={value} onChange={onChange} className="w-full bg-slate-50 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#1A4E5E] outline-none" />
  </div>
);

const SimSelect = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
    <select name={name} value={value} onChange={onChange} className="w-full bg-slate-50 border rounded-lg p-2 text-sm outline-none">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const ProbBar = ({ label, value, color }) => {
  // Aseguramos que el valor sea un número y no undefined
  const numericValue = parseFloat(value) || 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-black uppercase">
        <span>{label}</span>
        <span>{(numericValue * 100).toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`${color} h-full transition-all duration-700`} 
          style={{ width: `${numericValue * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
const EmptyState = ({ text }) => (
  <div className="py-8 text-center opacity-40">
    <AlertTriangle className="mx-auto mb-2" size={32} />
    <p className="text-xs italic">{text}</p>
  </div>
);

export default AICalculatorTab;