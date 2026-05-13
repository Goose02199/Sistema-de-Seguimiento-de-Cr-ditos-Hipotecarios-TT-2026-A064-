import React from 'react';
import { Briefcase, Building2, CalendarDays, Wallet, Clock, AlertCircle } from 'lucide-react';

const Step2Employment = ({ register, errors, watch }) => {
  // Observamos valores para validaciones cruzadas
  const birthDate = watch("birth_date");
  const employmentType = watch("employment_type");

  // Función para calcular la edad actual
  const calculateAge = () => {
    if (!birthDate) return 99; // Fallback si no hay fecha
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(birth.setFullYear(today.getFullYear()))) age--;
    return age;
  };

  const maxYearsPossible = calculateAge();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Briefcase className="text-[#1A4E5E]" /> Sección 2: Situación Laboral
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
        {/* Tipo de Empleo */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Tipo de Empleo</label>
          <select 
            {...register("employment_type", { required: "Seleccione su situación actual" })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          >
            <option value="">Seleccione...</option>
            <option value="nomina">Asalariado / Nómina</option>
            <option value="independiente">Independiente / Honorarios</option>
            <option value="publico">Sector Público (Gobierno)</option>
            <option value="privado">Sector Privado</option>
          </select>
          {errors.employment_type && <p className="text-red-500 text-[10px] mt-1">{errors.employment_type.message}</p>}
        </div>

        {/* Antigüedad (Años) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Antigüedad (Años)</label>
          <div className="relative">
            <CalendarDays className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="number"
              {...register("job_seniority_years", { 
                required: "Requerido",
                min: { value: 0, message: "No puede ser negativo" },
                max: { 
                  value: maxYearsPossible - 15, // Lógica: No pudo empezar a trabajar antes de los 15 años
                  message: `Inconsistente con tu edad (${maxYearsPossible} años)` 
                }
              })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E]"
              placeholder="Años"
            />
          </div>
          {errors.job_seniority_years && <p className="text-red-500 text-[10px] mt-1">{errors.job_seniority_years.message}</p>}
        </div>

        {/* Antigüedad (Meses) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Meses</label>
          <div className="relative">
            <Clock className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="number"
              {...register("job_seniority_months", { 
                required: "Requerido", 
                min: { value: 0, message: "Mínimo 0" },
                max: { value: 11, message: "Máximo 11" }
              })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E]"
              placeholder="0-11"
            />
          </div>
          {errors.job_seniority_months && <p className="text-red-500 text-[10px] mt-1">{errors.job_seniority_months.message}</p>}
        </div>
      </div>

      {/* Empresa y Cargo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {employmentType === 'independiente' ? 'Nombre del Negocio / Marca' : 'Empresa / Institución'}
          </label>
          <div className="relative">
            <Building2 className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <input 
              {...register("company_name", { required: "Este dato es vital para el perfil de riesgo" })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder={employmentType === 'independiente' ? "Ej. Consultoría Navarro" : "Ej. Google México"}
            />
          </div>
          {errors.company_name && <p className="text-red-500 text-[10px] mt-1">{errors.company_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Puesto / Cargo Actual</label>
          <input 
            {...register("job_title", { required: "Cargo requerido" })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="Ej. Gerente de Ventas"
          />
          {errors.job_title && <p className="text-red-500 text-[10px] mt-1">{errors.job_title.message}</p>}
        </div>
      </div>

      {/* Banner Informativo de Antigüedad */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
        <AlertCircle className="text-blue-600 shrink-0" size={20} />
        <p className="text-xs text-blue-700">
          <strong>Nota:</strong> La mayoría de las instituciones bancarias requieren una antigüedad mínima de <strong>12 a 24 meses</strong> para ser sujeto de crédito.
        </p>
      </div>

      {/* Nómina */}
      <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <Wallet className="text-[#1A4E5E]" />
          <div>
            <p className="text-sm font-bold text-gray-800">Recibo mi pago vía Nómina</p>
            <p className="text-xs text-gray-500">Esto facilita la comprobación de ingresos ante el banco.</p>
          </div>
        </div>
        <input 
          type="checkbox"
          {...register("payroll_at_bank")}
          className="w-5 h-5 text-[#1A4E5E] border-gray-300 rounded cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Step2Employment;