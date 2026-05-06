import React from 'react';
import { ArrowLeft, User, Briefcase, DollarSign, History, Cpu, PieChart, MapPin, Gavel } from 'lucide-react';
import AICalculatorTab from './AICalculatorTab';

const ApplicationDetail = ({ app, onBack }) => {
  // 1. Helper para formatear moneda
  const formatCurrency = (value) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

  // 2. Diccionarios de Etiquetas (Labels)
  const ownershipLabels = {
    'RENT': 'Renta', 'OWN': 'Propia', 'MORTGAGE': 'Hipotecada',
    'FAMILY': 'Familiar', 'OTHER': 'Otro', 'None': 'Ninguno'
  };

  const employmentLabels = {
    'nomina': 'Asalariado / Nómina', 'independiente': 'Independiente',
    'publico': 'Sector Público', 'privado': 'Sector Privado', 'otro': 'Otro'
  };

  const verificationLabels = {
    'not_verified': 'No Verificado', 'source_verified': 'Fuente Verificada', 'verified': 'Verificado'
  };

  const financingLabels = {
    'bancario': 'Bancario Puro', 'infonavit': 'Cofinavit (INFONAVIT)', 'fovissste': 'Fovissste para todos'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#1A4E5E] transition-colors">
          <ArrowLeft size={20} /> Volver a Cartera
        </button>
        <div className="text-right">
          <span className="text-xs text-gray-400 font-mono">ID Solicitud: #{app.id}</span>
          <h2 className="text-xl font-bold text-gray-800">{app.full_name}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left">
        
        {/* COLUMNA 1: DATOS DEL FORMULARIO */}
        <div className="xl:col-span-2 space-y-6">
          
          <DetailSection icon={<User />} title="Identidad y Vivienda">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField label="RFC / CURP" value={app.rfc_curp} />
              <InfoField label="Fecha Nac." value={app.birth_date} />
              <InfoField label="Email" value={app.email} />
              <InfoField label="Teléfono" value={app.phone} />
              <InfoField label="Propiedad" value={ownershipLabels[app.home_ownership] || app.home_ownership} />
              <InfoField label="Código Postal" value={app.postal_code} />
              <InfoField label="Municipio/Alcaldía" value={app.municipality} />
              <InfoField label="Estado" value={app.state} />
              <div className="col-span-full md:col-span-1"><InfoField label="Dirección" value={app.address} /></div>
            </div>
          </DetailSection>

          <DetailSection icon={<Briefcase />} title="Situación Laboral">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField label="Tipo Empleo" value={employmentLabels[app.employment_type] || app.employment_type} />
              <InfoField label="Empresa" value={app.company_name} />
              <InfoField label="Puesto" value={app.job_title} />
              <InfoField label="Antigüedad" value={`${app.job_seniority_years} años, ${app.job_seniority_months} meses`} />
              <InfoField label="Nómina en Banco" value={app.payroll_at_bank ? "Sí" : "No"} />
            </div>
          </DetailSection>

          <DetailSection icon={<DollarSign />} title="Finanzas y Propiedad">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField label="Crédito Solicitado" value={formatCurrency(app.loan_amnt)} isBold />
              <InfoField label="Valor Inmueble" value={formatCurrency(app.property_value)} />
              <InfoField label="Ingreso Anual (ML)" value={formatCurrency(app.annual_inc)} />
              <InfoField label="Gasto Mensual Apróximado" value={formatCurrency(app.monthly_expenses)} />
              <InfoField label="Pago Mensual de Otras deudas" value={formatCurrency(app.installment)} />
              <InfoField label="Enganche (%)" value={`${app.down_payment_pct}%`} />
              <InfoField label="Plazo" value={`${app.loan_term} años`} />
              <InfoField label="Financiamiento" value={financingLabels[app.financing_type] || app.financing_type} />
              <InfoField label="Ubicación Propiedad" value={app.property_location} />
              <InfoField label="Verificación" value={verificationLabels[app.verification_status] || app.verification_status} />
              <InfoField label="Subcuenta Vivienda" value={formatCurrency(app.housing_subaccount)} />
              {app.financing_type !== 'bancario' && (
                 <InfoField label="Crédito Instituto" value={formatCurrency(app.institute_credit_amount)} />
              )}
            </div>
          </DetailSection>

          <DetailSection icon={<History />} title="Historial y Buró (Variables ML)">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="DTI Ratio" value={`${app.dti}%`} />
              <InfoField label="Cuentas Abiertas" value={app.open_acc} />
              <InfoField label="Total Cuentas" value={app.total_acc} />
              <InfoField label="Moras (2 años)" value={app.delinq_2yrs} />
              <InfoField label="Pub Rec (Juicios)" value={app.pub_rec} />
              <InfoField label="Consultas (6m)" value={app.inq_last_6mths} />
              <InfoField label="Saldo Revolvente" value={formatCurrency(app.revol_bal)} />
              <InfoField label="Utilización (%)" value={`${app.revol_util}%`} />
              <InfoField label="1er Crédito (Año)" value={app.earliest_cr_line_year} />
              <InfoField label="Saldo Total (Deuda)" value={formatCurrency(app.tot_cur_bal)} />
              <InfoField label="Monto Cobranza" value={formatCurrency(app.tot_coll_amt)} />
              <InfoField label="Límite Rev. Hi" value={formatCurrency(app.total_rev_hi_lim)} />
              <InfoField label="Cobros 12m (N.M)" value={app.collections_12_mths_ex_med} />
            </div>
            {app.has_settlements && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-600 font-bold uppercase">Registro de Quitas / Acuerdos</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  <InfoField label="Cantidad Quitas" value={app.settlement_count} />
                  <InfoField label="Monto Condonado" value={formatCurrency(app.settlement_amount)} />
                </div>
              </div>
            )}
          </DetailSection>
        </div>

        {/* COLUMNA 2: INTELIGENCIA ARTIFICIAL */}
        <div className="space-y-6">
          <DetailSection icon={<Cpu className="text-purple-600" />} title="Riesgo (XGBoost)" highlight>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border">
                <span className="text-sm text-gray-500">Risk Label:</span>
                <span className="text-2xl font-black text-[#1A4E5E]">{app.risk_label}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border">
                <span className="text-sm text-gray-500">Risk Score:</span>
                <span className="text-2xl font-black text-[#1A4E5E]">{app.risk_score}</span>
              </div>
              <div className="space-y-2">
                <ProbabilityBar label="Bajo Riesgo" value={app.prob_low} color="bg-green-500" />
                <ProbabilityBar label="Medio Riesgo" value={app.prob_medium} color="bg-yellow-500" />
                <ProbabilityBar label="Alto Riesgo" value={app.prob_high} color="bg-red-500" />
              </div>
            </div>
          </DetailSection>

          <DetailSection icon={<PieChart className="text-blue-600" />} title="Recomendación (ExtraTrees)">
             <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-[300px]">
               <pre className="text-blue-400 text-[10px] font-mono">
                 {JSON.stringify(app.recommendations_data, null, 2)}
               </pre>
             </div>
             <p className="text-[10px] text-gray-400 mt-2 italic">* Datos crudos del motor de recomendación.</p>
          </DetailSection>

          <div className="bg-[#1A4E5E] text-white p-6 rounded-2xl shadow-lg">
            <h4 className="font-bold mb-2">Estatus del Proceso</h4>
            <p className="text-xs opacity-80 mb-4">Ingresado: {new Date(app.created_at).toLocaleString()}</p>
            <select 
              defaultValue={app.status}
              className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-sm outline-none cursor-pointer"
            >
              <option value="processed" className="text-gray-800">PROCESADO (IA)</option>
              <option value="under_review" className="text-gray-800">EN REVISIÓN BROKER</option>
              <option value="approved" className="text-gray-800">APROBADO</option>
              <option value="rejected" className="text-gray-800">RECHAZADO</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
};

/* Sub-componentes */
const DetailSection = ({ icon, title, children, highlight }) => (
  <div className={`p-6 rounded-2xl border ${highlight ? 'bg-slate-50 border-purple-100 shadow-inner' : 'bg-white border-gray-100 shadow-sm'}`}>
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[#1A4E5E]">{icon}</span>
      <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoField = ({ label, value, isBold }) => (
  <div className="space-y-1">
    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{label}</p>
    <p className={`text-sm ${isBold ? 'font-bold text-[#1A4E5E]' : 'text-gray-600'} break-words`}>
      {value !== null && value !== undefined && value !== '' ? value : '0'}
    </p>
  </div>
);

const ProbabilityBar = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-bold">
      <span className="text-gray-500 uppercase">{label}</span>
      <span className="text-gray-700">{(value * 100).toFixed(2)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${value * 100}%` }}></div>
    </div>
  </div>
);

export default ApplicationDetail;