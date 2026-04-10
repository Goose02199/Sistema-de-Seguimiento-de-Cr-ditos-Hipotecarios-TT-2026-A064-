import React from 'react';
import { User, Mail, Phone, Calendar, Home, MapPin } from 'lucide-react';

const Step1Identity = ({ register, errors }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
      <User className="text-[#1A4E5E]" /> Sección 1: Perfil de Identidad y Vivienda
    </h2>

    {/* Fila 1: Nombres y Apellidos (Se unirán en el backend) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre(s)</label>
        <input 
          {...register("first_name", { required: "Campo requerido" })}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          placeholder="Ej. Ángel Gustavo"
        />
        {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Apellido(s)</label>
        <input 
          {...register("last_name", { required: "Campo requerido" })}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          placeholder="Ej. Navarro Guzmán"
        />
        {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
      </div>
    </div>

    {/* Fila 2: Identificación Técnica y Nacimiento */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <div>
        <label className="block text-sm font-medium text-gray-700">RFC / CURP</label>
        <input 
          {...register("rfc_curp", { required: "La identificación es obligatoria" })}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          placeholder="NAGA000000..."
        />
        {errors.rfc_curp && <p className="text-red-500 text-xs mt-1">{errors.rfc_curp.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
        <div className="relative">
          <Calendar className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="date"
            {...register("birth_date", { required: "Fecha requerida" })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
          />
        </div>
      </div>
    </div>

    {/* Fila 3: Contacto */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <div>
        <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
        <div className="relative">
          <Mail className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="email"
            {...register("email", { 
              required: "Email requerido",
              pattern: { value: /^\S+@\S+$/i, message: "Email inválido" }
            })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="goose@escom.ipn.mx"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
        <div className="relative">
          <Phone className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="tel"
            {...register("phone")}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="55-0000-0000"
          />
        </div>
      </div>
    </div>

    {/* Fila 4: Vivienda (Crítico para XGBoost) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <div>
        <label className="block text-sm font-medium text-gray-700">Situación de Vivienda</label>
        <div className="relative">
          <Home className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <select 
            {...register("home_ownership", { required: "Seleccione una opción" })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E] appearance-none"
          >
            <option value="">Seleccione...</option>
            <option value="RENT">Renta</option>
            <option value="OWN">Propia</option>
            <option value="MORTGAGE">Hipotecada</option>
            <option value="FAMILY">Familiar</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Este campo impacta directamente en el modelo de riesgo.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Código Postal</label>
        <div className="relative">
          <MapPin className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input 
            {...register("postal_code", { required: "Dato requerido" })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
            placeholder="07738"
          />
        </div>
      </div>
    </div>
  </div>
);

export default Step1Identity;