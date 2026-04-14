import React from 'react';
import { 
  CheckCircle2, User, Briefcase, DollarSign, 
  History, Download, ArrowLeft, Printer, Edit2
} from 'lucide-react';

const ResultsView = ({ sentData, receivedData, onEdit }) => {
  const formatCurrency = (value) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

  const isEditable = receivedData?.status === 'processed';

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500 text-left">
      
      {/* 1. ESTILOS DE IMPRESIÓN (Inyectados directamente) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* 1. RESET DE LAYOUT: Forzamos a los padres a ser visibles y sin altura fija */
          html, body, #root, .app-layout, main {
            height: auto !important;
            overflow: visible !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 2. OCULTAR ELEMENTOS: Quitamos todo lo que no es el comprobante */
          /* Añadí selectores comunes de sidebars y headers */
          nav, aside, header, footer, .no-print, button, .sidebar, .topbar {
            display: none !important;
          }

          /* 3. CONTENEDOR PRINCIPAL: Eliminamos el scroll y márgenes del Layout */
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

          /* 4. OPTIMIZACIÓN DE TABLAS Y TARJETAS */
          .print-card {
            break-inside: avoid !important; /* Evita que una tarjeta se parta a la mitad entre páginas */
            border: 1px solid #eee !important;
            margin-bottom: 1rem !important;
          }

          .print-header {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Eliminar links automáticos que pone el navegador (URL en el pie de página) */
          @page {
            margin: 1cm;
          }
        }
      `}} />

      <div className="print-container space-y-8">
        {/* Encabezado del Comprobante */}
        <div className="print-header text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="no-print w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Comprobante de Registro Hipotecario</h1>
          <p className="text-gray-600 mt-1">Sistema de Prospección Crediticia con IA</p>
          <div className="mt-4 inline-block bg-white px-6 py-2 rounded-full border border-slate-200 text-sm font-bold text-[#1A4E5E]">
            Folio de Seguimiento: #{receivedData?.id} 
          </div>
          <p className="text-[10px] text-gray-400 mt-4 uppercase">Fecha de generación: {new Date().toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identidad */}
          <SummaryCard icon={<User size={18} />} title="Perfil de Identidad y Vivienda" className="print-card">
            <DataRow label="Nombre" value={sentData?.full_name}  />
            <DataRow label="RFC / CURP" value={sentData?.rfc_curp}  />
            <DataRow label="Fecha de Nacimiento" value={sentData?.birth_date}  />
            <DataRow label="Correo" value={sentData?.email}  />
            <DataRow label="Teléfono" value={sentData?.phone}  />
            <DataRow label="Situación Vivienda" value={sentData?.home_ownership}  />
            <DataRow label="Código Postal" value={sentData?.postal_code}  />
          </SummaryCard>

          {/* Laboral */}
          <SummaryCard icon={<Briefcase size={18} />} title="Situación Laboral" className="print-card">
            <DataRow label="Tipo Empleo" value={sentData?.employment_type }  />
            <DataRow label="Antigüedad" value={`${sentData?.job_seniority} años`}  />
            <DataRow label="Empresa" value={sentData?.company_name}  />
            <DataRow label="Puesto" value={sentData?.job_title}  />
            <DataRow label="Nómina" value={sentData?.payroll_at_bank}  />
          </SummaryCard>

          {/* Finanzas */}
          <SummaryCard icon={<DollarSign size={18} />} title="Ingresos y Capacidad Financiera" className="print-card">
            <DataRow label="Ingreso Mensual Neto (MXN)" value={formatCurrency(sentData?.monthly_income)}  />
            <DataRow label="Gasto Mensual Aproximado" value={formatCurrency(sentData?.monthly_expenses)}  />
            <DataRow label="Pago Mensual de Otras Deudas" value={`${sentData?.installment|| 10} años`}  />
            <DataRow label="Fuente de Verificación" value={formatCurrency(sentData?.verification_status)}  />
          </SummaryCard>

          {/* Propiedad*/}
          <SummaryCard icon={<DollarSign size={18} />} title="Detalles del Crédito y Propiedad" className="print-card">
            <DataRow label="Valor del Inmueble (MXN)" value={formatCurrency(sentData?.property_value)}  />
            <DataRow label="Porcentaje de Enganche (%)" value={formatCurrency(sentData?.down_payment_pct)}  />
            <DataRow label="Monto de Crédito Solicitado" value={formatCurrency(sentData?.loan_amnt)}  />
            <DataRow label="Plazo Deseado (Años)" value={`${sentData?.loan_term} años`}  />
            <DataRow label="Esquema de Financiamiento" value={`${sentData?.financing_type} años`}  />
            <DataRow label="Saldo Subcuenta Vivienda" value={`${sentData?.housing_subaccount} años`}  />
          </SummaryCard>

          {/* Historial */}
          <SummaryCard icon={<History size={18} />} title="Información del Buró de Crédito" className="print-card">
            <DataRow label="Saldo Total Revolvente" value={`${sentData?.revol_bal}%`} />
            <DataRow label="Límite Total de Crédito" value={sentData?. total_rev_hi_lim} />
            <DataRow label="% de Utilización" value={sentData?.revol_util} />
            <DataRow label="Cuentas Abiertas" value={`${sentData?.open_acc}%`} />
            <DataRow label="Total de Cuentas (Historial)" value={`${sentData?.total_acc}%`} />
            <DataRow label="Moras (últimos 2 años)" value={sentData?.delinq_2yrs} />
            <DataRow label="Moras (últimos 6 meses)" value={`${sentData?. inq_last_6mths}%`} />
            <DataRow label="Año del Primer Crédito" value={sentData?.earliest_cr_line_year} />
            <DataRow label="Saldo Total Actual" value={sentData?.tot_cur_bal} />
            <DataRow label="Monto en Cobranza (Collection)" value={`${sentData?.tot_coll_amt}%`} />
            <DataRow label="Cobros últimos 12 meses (No médicos)s" value={sentData?.collections_12_mths_ex_med} />
            <DataRow label="Quitas o Recuperaciones" value={sentData?.has_settlements} />
          </SummaryCard>
        </div>
      </div>

      {/* Botones de Acción (Se ocultan al imprimir gracias a .no-print) */}
      <div className="no-print flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t border-slate-100">
        <button 
          type="button"
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 border-2 border-[#1A4E5E] text-[#1A4E5E] px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          <Printer size={20} /> Imprimir Comprobante
        </button>
        <button 
          type="button"
          onClick={() => window.location.href = '/inicio'}
          className="flex items-center justify-center gap-2 bg-[#1A4E5E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#133a46] transition-all shadow-lg"
        >
          <ArrowLeft size={20} /> Volver al Inicio
        </button>

        {isEditable && (
          <button 
            type="button"
            onClick={onEdit}
            className="flex items-center justify-center gap-2 border-2 border-[#1A4E5E] text-[#1A4E5E] px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Edit2 size={20} /> Modificar Datos
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
    <span className="text-slate-700 font-bold text-right">{value || 'N/A'}</span>
  </div>
);

export default ResultsView;