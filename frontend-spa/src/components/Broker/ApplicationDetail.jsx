import React, { useState } from 'react';
import { 
  ArrowLeft, User, Briefcase, DollarSign, 
  History, Cpu, PieChart, MapPin, Gavel, 
  FileText, Activity, Clock, TrendingDown, 
  Wallet, Award, Info, ChevronDown, ChevronUp,
  ShieldCheck, Landmark, Tags, FlaskConical
} from 'lucide-react';
import AICalculatorTab from './AICalculatorTab';

const ApplicationDetail = ({ app, onBack }) => {
  const [activeTab, setActiveTab] = useState('expediente');

  const formatCurrency = (value) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

  const ownershipLabels = { 'RENT': 'Renta', 'OWN': 'Propia', 'MORTGAGE': 'Hipotecada', 'FAMILY': 'Familiar', 'OTHER': 'Otro', 'None': 'Ninguno' };
  const employmentLabels = { 'nomina': 'Asalariado / Nómina', 'independiente': 'Independiente', 'publico': 'Sector Público', 'privado': 'Sector Privado', 'otro': 'Otro' };
  const verificationLabels = { 'not_verified': 'No Verificado', 'source_verified': 'Fuente Verificada', 'verified': 'Verificado' };
  const financingLabels = { 'bancario': 'Bancario Puro', 'infonavit': 'Cofinavit (INFONAVIT)', 'fovissste': 'Fovissste para todos' };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-gray-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{app.full_name}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-400 font-mono mt-1">
              <span>ID de Seguimiento: #{app.id}</span>
              <span className="flex items-center gap-1"><Clock size={12}/> {new Date(app.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-gray-400 uppercase ml-2">Estatus:</span>
          <select 
            defaultValue={app.status}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-bold text-[#1A4E5E] outline-none shadow-sm"
          >
            <option value="processed">PROCESADO (IA)</option>
            <option value="under_review">EN REVISIÓN</option>
            <option value="approved">APROBADO</option>
            <option value="rejected">RECHAZADO</option>
          </select>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-gray-200">
        <TabButton active={activeTab === 'expediente'} onClick={() => setActiveTab('expediente')} icon={<FileText size={18} />} label="Expediente del Cliente" />
        <TabButton active={activeTab === 'analisis'} onClick={() => setActiveTab('analisis')} icon={<Activity size={18} />} label="Análisis de Riesgo e IA" />
        <TabButton active={activeTab === 'documentos'} onClick={() => setActiveTab('documentos')} icon={<ShieldCheck size={18} />} label="Documentos" />
        <TabButton active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} icon={<FlaskConical size={18} />} label="Calculadora IA" />
      </div>

      <div className="mt-6">
        {activeTab === 'expediente' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <SummaryCard icon={<User size={18} />} title="Sección 1: Identidad y Vivienda">
              <DataRow label="Nombre Completo" value={app.full_name} />
              <DataRow label="RFC / CURP" value={app.rfc_curp} />
              <DataRow label="Fecha de Nacimiento" value={app.birth_date} />
              <DataRow label="Email" value={app.email} />
              <DataRow label="Teléfono" value={app.phone} />
              <DataRow label="Situación Vivienda" value={ownershipLabels[app.home_ownership] || app.home_ownership} />
              <DataRow label="Dirección" value={app.address} />
              <DataRow label="Ubicación" value={`${app.municipality}, ${app.state}`} />
              <DataRow label="Código Postal" value={app.postal_code} />
            </SummaryCard>

            <SummaryCard icon={<Briefcase size={18} />} title="Sección 2: Situación Laboral">
              <DataRow label="Tipo de Empleo" value={employmentLabels[app.employment_type] || app.employment_type} />
              <DataRow label="Antigüedad" value={`${app.job_seniority_years}a ${app.job_seniority_months}m`} />
              <DataRow label="Empresa / Institución" value={app.company_name} />
              <DataRow label="Puesto / Cargo" value={app.job_title} />
              <DataRow label="Nómina en este Banco" value={app.payroll_at_bank ? "Sí" : "No"} />
            </SummaryCard>

            <SummaryCard icon={<DollarSign size={18} />} title="Sección 3: Ingresos y Finanzas">
              <DataRow label="Ingreso Mensual" value={formatCurrency(app.annual_inc / 12)} />
              <DataRow label="Ingreso Anual (ML)" value={formatCurrency(app.annual_inc)} />
              <DataRow label="Gastos Mensuales" value={formatCurrency(app.monthly_expenses)} />
              <DataRow label="Carga de Deudas" value={formatCurrency(app.installment)} />
              <DataRow label="Ratio DTI" value={`${app.dti}%`} />
              <DataRow label="Fuente Verificación" value={verificationLabels[app.verification_status] || app.verification_status} />
            </SummaryCard>

            <SummaryCard icon={<MapPin size={18} />} title="Sección 4: Crédito y Propiedad">
              <DataRow label="Valor del Inmueble" value={formatCurrency(app.property_value)} />
              <DataRow label="Ubicación Propiedad" value={app.property_location} />
              <DataRow label="Monto Solicitado" value={formatCurrency(app.loan_amnt)} />
              <DataRow label="Enganche (%)" value={`${app.down_payment_pct}%`} />
              <DataRow label="Esquema" value={financingLabels[app.financing_type] || app.financing_type} />
              <DataRow label="Plazo" value={`${app.loan_term} años`} />
              <DataRow label="Subcuenta Vivienda" value={formatCurrency(app.housing_subaccount)} />
              {app.financing_type !== 'bancario' && (
                <DataRow label="Crédito Instituto" value={formatCurrency(app.institute_credit_amount)} />
              )}
            </SummaryCard>

            <div className="md:col-span-2">
              <SummaryCard icon={<History size={18} />} title="Sección 5: Información del Buró de Crédito">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                  <DataRow label="Saldo Revolvente" value={formatCurrency(app.revol_bal)} />
                  <DataRow label="Límite Revolvente" value={formatCurrency(app.total_rev_hi_lim)} />
                  <DataRow label="Utilización (%)" value={`${app.revol_util}%`} />
                  <DataRow label="Cuentas (Abiertas/Tot)" value={`${app.open_acc} / ${app.total_acc}`} />
                  <DataRow label="Moras (2 años)" value={app.delinq_2yrs} />
                  <DataRow label="Registros Públicos" value={app.pub_rec} />
                  <DataRow label="Consultas (6m)" value={app.inq_last_6mths} />
                  <DataRow label="Año 1er Crédito" value={app.earliest_cr_line_year} />
                  <DataRow label="Saldo Total (Deuda)" value={formatCurrency(app.tot_cur_bal)} />
                  <DataRow label="Monto Cobranza" value={formatCurrency(app.tot_coll_amt)} />
                  <DataRow label="Cobros 12m (NM)" value={app.collections_12_mths_ex_med} />
                  <DataRow label="Quitas (Settlements)" value={app.has_settlements ? "Sí" : "No"} />
                </div>
              </SummaryCard>
            </div>
          </div>
        ) }
        {activeTab === 'documentos' && <DocumentManager app={app} />}
        {activeTab === 'analisis' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <SummaryCard icon={<Cpu className="text-purple-600" />} title="Estatus de Riesgo (XGBoost)">
                <div className="py-4">
                  <div className="text-center mb-6">
                    <span className="text-sm text-gray-400 uppercase font-bold tracking-widest">Riesgo</span>
                    <p className="text-5xl font-black text-[#1A4E5E]">{app.risk_label}</p>
                  </div>
                  <div className="text-center mb-6">
                    <span className="text-sm text-gray-400 uppercase font-bold tracking-widest">Puntuación de Riesgo</span>
                    <p className="text-5xl font-black text-[#1A4E5E]">{app.risk_score}</p>
                  </div>
                  <div className="space-y-4">
                    <ProbabilityBar label="Bajo Riesgo" value={app.prob_low} color="bg-green-500" />
                    <ProbabilityBar label="Medio Riesgo" value={app.prob_medium} color="bg-yellow-500" />
                    <ProbabilityBar label="Alto Riesgo" value={app.prob_high} color="bg-red-500" />
                  </div>
                </div>
              </SummaryCard>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <PieChart size={18} className="text-blue-600" /> Top 5 Productos Recomendados
                </h3>
              </div>

              <div className="space-y-3">
                {app.recommendations_data?.recommendations?.map((rec, index) => (
                  <RecommendationCard 
                    key={index} 
                    rec={rec} 
                    isTop={index === 0} 
                    formatCurrency={formatCurrency} 
                  />
                ))}
              </div>

              <div className="bg-slate-900 rounded-xl p-4 mt-6">
                <details className="cursor-pointer">
                  <summary className="text-[10px] text-slate-400 font-mono uppercase tracking-widest flex items-center gap-2">
                    Debug: Ver JSON crudo
                  </summary>
                  <pre className="text-blue-400 text-[10px] font-mono mt-4 overflow-auto max-h-[400px]">
                    {JSON.stringify(app.recommendations_data, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'calculadora' && <AICalculatorTab app={app} />}
      </div>
    </div>
  );
};

/* --- SUBCOMPONENTE DE TARJETA EXPANDIBLE --- */

const RecommendationCard = ({ rec, isTop, formatCurrency }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`relative bg-white border rounded-2xl transition-all hover:shadow-md overflow-hidden ${isTop ? 'border-blue-300 ring-1 ring-blue-50' : 'border-slate-100'}`}>
      {isTop && (
        <div className="absolute -left-1 -top-1 bg-blue-600 text-white p-1.5 rounded-br-xl shadow-lg z-10">
          <Award size={16} />
        </div>
      )}

      <div className="p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">{rec.institucion}</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">
                {rec.programa_adicional}
              </span>
            </div>
            <h4 className="font-bold text-gray-800 text-sm">{rec.producto_base}</h4>
            
            <div className="flex gap-6 mt-3">
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold">CAT Predicho</p>
                <p className="text-lg font-black text-[#1A4E5E]">{parseFloat(rec.CAT_Predicho).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold">Pago Mensual</p>
                <p className="text-lg font-black text-gray-800">{formatCurrency(rec.PagoMensual)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-1 gap-1 min-w-[160px]">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Desembolso:</span>
                <span className="font-bold">{formatCurrency(rec.DesembolsoInicial)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Plazo:</span>
                <span className="font-bold">{rec.plazoAnios} años</span>
              </div>
            </div>

            <button 
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-[#1A4E5E]"
              title={expanded ? "Ocultar detalles" : "Ver detalles completos"}
            >
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN DESPLEGABLE CON DETALLES DEL JSON */}
      {expanded && (
        <div className="bg-slate-50/50 border-t border-slate-100 p-4 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DetailItem icon={<Landmark size={12}/>} label="Origen" value={rec.origen} />
            <DetailItem icon={<Landmark size={12}/>} label="CAT del mercado" value={rec.CAT_Pct} />
            <DetailItem icon={<Tags size={12}/>} label="Segmento ID" value={rec.Segmento_ID} />
            <DetailItem icon={<TrendingDown size={12}/>} label="Tasa Nominal" value={`${rec.Tasa_Nominal_Pct}%`} />
            <DetailItem icon={<ShieldCheck size={12}/>} label="Indexación" value={rec.tipoIndexacion} />
            <DetailItem label="Comisión Apertura" value={`${rec.comisionAperturaPct}%`} />
            <DetailItem label="Monto Crédito" value={formatCurrency(rec.montoCredito)} />
            <DetailItem label="Valor Vivienda" value={formatCurrency(rec.valorVivienda)} />
            <DetailItem label="Ingreso Cliente" value={formatCurrency(rec.ingresoMensual)} />
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="space-y-0.5">
    <p className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1">
      {icon} {label}
    </p>
    <p className="text-xs font-bold text-gray-700 capitalize">
      {(value !== null && value !== undefined) ? value : 'N/A'}
    </p>
  </div>
);

/* --- OTROS SUBCOMPONENTES --- */

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
      active ? 'border-[#1A4E5E] text-[#1A4E5E] bg-slate-50' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
    }`}
  >
    {icon} {label}
  </button>
);

const SummaryCard = ({ icon, title, children }) => (
  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm h-full">
    <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-3">
      <span className="text-[#1A4E5E]">{icon}</span>
      <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const DataRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm py-0.5">
    <span className="text-slate-400 font-medium">{label}:</span>
    <span className="text-slate-700 font-bold text-right ml-4">
      {value !== null && value !== undefined && value !== '' ? value : '0'}
    </span>
  </div>
);

const ProbabilityBar = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-bold">
      <span className="text-gray-500 uppercase">{label}</span>
      <span className="text-gray-700">{(value * 100).toFixed(2)}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className={`${color} h-full transition-all duration-1000 ease-out shadow-sm`} style={{ width: `${value * 100}%` }}></div>
    </div>
  </div>
);

export default ApplicationDetail;