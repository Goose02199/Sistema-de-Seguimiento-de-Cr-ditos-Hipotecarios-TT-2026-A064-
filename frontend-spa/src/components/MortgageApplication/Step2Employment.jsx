import React from 'react';
import { Briefcase, Building2, CalendarDays, Wallet } from 'lucide-react';

const Step2Employment = ({ register, errors }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
      <Briefcase className="text-[#1A4E5E]" /> Sección 2: Situación Laboral
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      {/* Tipo de Empleo [cite: 17, 18] */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo de Empleo</label>
        <select 
          {...register("employment_type", { required: "Seleccione una opción" })}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
        >
          <option value="">Seleccione...</option>
          <option value="asalariado">Asalariado / Nómina</option>
          <option value="independiente">Independiente</option>
          <option value="publico">Sector Público</option>
          <option value="privado">Sector Privado</option>
        </select>
        {errors.employment_type && <p className="text-red-500 text-xs mt-1">{errors.employment_type.message}</p>}
      </div>

      {/* Antigüedad Laboral [cite: 19] */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Antigüedad (Años)</label>
        <div className="relative">
          <CalendarDays className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="number"
            {...register("job_seniority", { required: "Dato requerido", min: 0 })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="Ej. 3"
          />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      {/* Empresa y Cargo [cite: 20, 21] */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Empresa / Institución</label>
        <div className="relative">
          <Building2 className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input 
            {...register("company_name", { required: "Nombre de empresa requerido" })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="Nombre de tu empleo"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Puesto / Cargo</label>
        <input 
          {...register("job_title", { required: "Cargo requerido" })}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          placeholder="Ej. Analista de Sistemas"
        />
      </div>
    </div>

    {/* Manejo de Nómina [cite: 22] */}
    <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Wallet className="text-[#1A4E5E]" />
        <div>
          <p className="text-sm font-bold text-gray-800">¿Recibes tu nómina en este banco?</p>
          <p className="text-xs text-gray-500">Esto puede mejorar tu CAT predicho.</p>
        </div>
      </div>
      <input 
        type="checkbox"
        {...register("payroll_at_bank")}
        className="w-5 h-5 text-[#1A4E5E] border-gray-300 rounded focus:ring-[#1A4E5E]"
      />
    </div>
  </div>
);

export default Step2Employment;