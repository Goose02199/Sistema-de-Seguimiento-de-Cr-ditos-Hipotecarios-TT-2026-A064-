import React from 'react';
import { 
  CheckCircle2, User, Briefcase, DollarSign, 
  History, ArrowLeft, Printer, Edit2, MapPin, Gavel
} from 'lucide-react';

const ResultsView = ({ sentData, receivedData, onEdit }) => {
  const formatCurrency = (value) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

  const isEditable = receivedData?.status === 'processed' || receivedData?.status === 'pending';

  const verificationLabels = {
    'not_verified': 'No Verificado',
    'source_verified': 'Fuente Verificada',
    'verified': 'Verificado'
  };

  const ownershipLabels = {
    'RENT': 'Renta',
    'OWN': 'Propia',
    'MORTGAGE': 'Hipotecada',
    'FAMILY': 'Familiar',
    'OTHER': 'Otro',
    'None': 'Ninguno'
  };

  const employmentLabels = {
    'nomina': 'Asalariado / Nómina',
    'independiente': 'Independiente',
    'publico': 'Sector Público',
    'privado': 'Sector Privado',
    'otro': 'Otro'
  };

  const financingLabels = {
    'bancario': 'Bancario Puro',
    'infonavit': 'Cofinavit (INFONAVIT)',
    'fovissste': 'Fovissste para todos'
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500 text-left">
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body, #root, .app-layout, main {
            height: auto !important;
            overflow: visible !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, aside, header, footer, .no-print, button, .sidebar, .topbar {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            z-index: 9999;
          }
          .print-card {
            break-inside: avoid !important;
            border: 1px solid #eee !important;
            margin-bottom: 1rem !important;
          }
          .print-header {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { margin: 1cm; }
        }
      `}} />

      <div className="print-container space-y-8">
        {/* Encabezado del Comprobante */}
        <div className="print-header text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="no-print w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Comprobante de Registro Hipotecario</h1>
          <p className="text-gray-600 mt-1">Expediente Digital de Prospección - ESCOM TT</p>
          <div className="mt-4 inline-block bg-white px-6 py-2 rounded-full border border-slate-200 text-sm font-bold text-[#1A4E5E]">
            Folio de Seguimiento: #{receivedData?.id || 'PROVISIONAL'} 
          </div>
          <p className="text-[10px] text-gray-400 mt-4 uppercase">Fecha de solicitud: {new Date().toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECCIÓN 1: IDENTIDAD Y LOCALIZACIÓN */}
          <SummaryCard icon={<User size={18} />} title="Perfil de Identidad y Vivienda" className="print-card">
            <DataRow label="Nombre Completo" value={sentData?.full_name} />
            <DataRow label="RFC / CURP" value={sentData?.rfc_curp} />
            <DataRow label="Nacimiento" value={sentData?.birth_date} />
            <DataRow label="Situación Vivienda" value={ownershipLabels[sentData?.home_ownership] || sentData?.home_ownership} />
            <DataRow label="Dirección" value={sentData?.address} />
            <DataRow label="Ubicación" value={`${sentData?.municipality}, ${sentData?.state}`} />
            <DataRow label="CP" value={sentData?.postal_code} />
          </SummaryCard>

          {/* SECCIÓN 2: LABORAL */}
          <SummaryCard icon={<Briefcase size={18} />} title="Situación Laboral" className="print-card">
            <DataRow label="Ocupación" value={employmentLabels[sentData?.employment_type] || sentData?.employment_type} /> 
            <DataRow label="Antigüedad" value={`${sentData?.job_seniority_years}a ${sentData?.job_seniority_months}m`} />
            <DataRow label="Empresa" value={sentData?.company_name} />
            <DataRow label="Puesto" value={sentData?.job_title} />
            <DataRow label="Nómina en Banco" value={sentData?.payroll_at_bank ? "Sí" : "No"} />
          </SummaryCard>

          {/* SECCIÓN 3: FINANZAS */}
          <SummaryCard icon={<DollarSign size={18} />} title="Ingresos y Capacidad Financiera" className="print-card">
            <DataRow label="Ingreso Mensual" value={formatCurrency(sentData?.monthly_income)} />
            <DataRow label="Gastos Mensuales" value={formatCurrency(sentData?.monthly_expenses)} />
            <DataRow label="Carga de Deuda (Otras)" value={formatCurrency(sentData?.installment)} />
            <DataRow label="DTI Ratio" value={sentData?.dti ? `${sentData.dti}%` : 'N/A'} />
            <DataRow label="Verificación" value={verificationLabels[sentData?.verification_status] || sentData?.verification_status} />
          </SummaryCard>

          {/* SECCIÓN 4: PROPIEDAD Y CRÉDITO */}
          <SummaryCard icon={<MapPin size={18} />} title="Detalles del Crédito y Propiedad" className="print-card">
            <DataRow label="Valor Inmueble" value={formatCurrency(sentData?.property_value)} />
            <DataRow label="Ubicación Propiedad" value={sentData?.property_location} />
            <DataRow label="Monto Solicitado" value={formatCurrency(sentData?.loan_amnt)} />
            <DataRow label="Enganche" value={`${sentData?.down_payment_pct}%`} />
            <DataRow label="Esquema" value={financingLabels[sentData?.financing_type] || sentData?.financing_type} />
            <DataRow label="Plazo" value={`${sentData?.loan_term} años`} />
            {sentData?.financing_type !== 'bancario' && (
              <DataRow label="Crédito Instituto" value={formatCurrency(sentData?.institute_credit_amount)} />
            )}
            <DataRow label="Subcuenta Vivienda" value={formatCurrency(sentData?.housing_subaccount)} />
          </SummaryCard>

          {/* SECCIÓN 5: BURÓ DE CRÉDITO */}
          <SummaryCard icon={<History size={18} />} title="Información del Buró de Crédito" className="print-card">
            <div className="grid grid-cols-1 gap-1">
              <DataRow label="Saldo Revolvente" value={formatCurrency(sentData?.revol_bal)} />
              <DataRow label="Límite Revolvente" value={formatCurrency(sentData?.total_rev_hi_lim)} />
              <DataRow label="Utilización" value={sentData?.revol_util !== undefined ? `${sentData.revol_util}%` : '0%'} />
              <DataRow label="Cuentas (Abiertas/Totales)" value={`${sentData?.open_acc} / ${sentData?.total_acc}`} />
              <DataRow label="Moras (2a)" value={sentData?.delinq_2yrs} />
              <DataRow label="Registros Públicos" value={sentData?.pub_rec} />
              <DataRow label="Consultas (6m)" value={sentData?.inq_last_6mths} />
              <DataRow label="Año 1er Crédito" value={sentData?.earliest_cr_line_year} />
              <DataRow label="Saldo Total (Deuda)" value={formatCurrency(sentData?.tot_cur_bal)} />
              <DataRow label="Colecciones" value={formatCurrency(sentData?.tot_coll_amt)} />
              <DataRow label="Cobros últimos 12 meses (No médicos)" value={sentData?.collections_12_mths_ex_med} />
              <DataRow label="Quitas (Convenios)" value={sentData?.has_settlements ? "Sí" : "No"} />
              {sentData?.has_settlements && (
                <div className="mt-1 pt-1 border-t border-red-50 text-[10px] text-red-700">
                  <DataRow label="Num. Quitas" value={sentData?.settlement_count} />
                  <DataRow label="Monto Condonado" value={formatCurrency(sentData?.settlement_amount)} />
                </div>
              )}
            </div>
          </SummaryCard>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="no-print flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t border-slate-100">
        <button onClick={() => window.print()} className="flex items-center justify-center gap-2 border-2 border-[#1A4E5E] text-[#1A4E5E] px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">
          <Printer size={20} /> Imprimir Comprobante
        </button>
        <button onClick={() => window.location.href = '/dashboard'} className="flex items-center justify-center gap-2 bg-[#1A4E5E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#133a46] transition-all shadow-lg">
          <ArrowLeft size={20} /> Volver al Tablero
        </button>
        {isEditable && (
          <button onClick={onEdit} className="flex items-center justify-center gap-2 border-2 border-amber-600 text-amber-600 px-8 py-3 rounded-xl font-bold hover:bg-amber-50 transition-all shadow-sm">
            <Edit2 size={20} /> Modificar Solicitud
          </button>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, title, children, className }) => (
  <div className={`bg-white border border-slate-100 rounded-2xl p-5 shadow-sm ${className}`}>
    <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
      <span className="text-[#1A4E5E]">{icon}</span>
      <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{title}</h3>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const DataRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-400 font-medium">{label}:</span>
    <span className="text-slate-700 font-bold text-right">
      {(value !== null && value !== undefined && value !== '') ? value : '0'}
    </span>
  </div>
);

export default ResultsView;