import React, { useEffect } from 'react';
import { User, Mail, Phone, Calendar, Home, MapPin, Building, Globe } from 'lucide-react';

const CP_ALCALDIAS = {
  '01': 'Álvaro Obregón', '02': 'Azcapotzalco', '03': 'Benito Juárez', '04': 'Coyoacán',
  '05': 'Cuajimalpa de Morelos', '06': 'Cuauhtémoc', '07': 'Gustavo A. Madero', '08': 'Iztacalco',
  '09': 'Iztapalapa', '10': 'La Magdalena Contreras', '11': 'Miguel Hidalgo', '12': 'Tláhuac',
  '13': 'Xochimilco', '14': 'Tlalpan', '15': 'Venustiano Carranza', '16': 'Milpa Alta'
};

const Step1Identity = ({ register, errors, setValue, watch }) => {

  const postalCodeValue = watch("postal_code");

  // Efecto para autocompletar Estado y Municipio basado en CP
  useEffect(() => {
    if (postalCodeValue && postalCodeValue.length >= 2) {
      const prefix = postalCodeValue.substring(0, 2);
      if (CP_ALCALDIAS[prefix]) {
        setValue("state", "Ciudad de México");
        setValue("municipality", CP_ALCALDIAS[prefix]);
      }
    }
  }, [postalCodeValue, setValue]);

  // Validación de edad (18 - 90 años)
  const validateAge = (value) => {
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) return "Debes ser mayor de 18 años";
    if (age > 90) return "La edad máxima permitida es 90 años";
    return true;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <User className="text-[#1A4E5E]" /> Sección 1: Perfil de Identidad y Vivienda
      </h2>

      {/* Nombres y Apellidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre(s)</label>
          <input 
            {...register("first_name", { required: "Campo requerido" })}
            className={`mt-1 block w-full p-2 border rounded-md focus:ring-[#1A4E5E] ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.first_name && <p className="text-red-500 text-[10px] mt-1">{errors.first_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Apellido(s)</label>
          <input 
            {...register("last_name", { required: "Campo requerido" })}
            className={`mt-1 block w-full p-2 border rounded-md focus:ring-[#1A4E5E] ${errors.last_name ? 'border-red-500' : 'border-gray-300'}`}
          />
        </div>
      </div>

      {/* RFC/CURP y Fecha de Nacimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700">RFC / CURP</label>
          <input 
            {...register("rfc_curp", { 
                required: "Requerido",
                pattern: {
                    value: /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNSL]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])|([A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3})$/i,
                    message: "Formato de RFC o CURP inválido"
                }
            })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md uppercase"
            placeholder="MÁX 18 CARACTERES"
          />
          {errors.rfc_curp && <p className="text-red-500 text-[10px] mt-1">{errors.rfc_curp.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
          <input 
            type="date"
            {...register("birth_date", { 
              required: "Fecha requerida",
              validate: validateAge
            })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
          {errors.birth_date && <p className="text-red-500 text-[10px] mt-1">{errors.birth_date.message}</p>}
        </div>
      </div>

      {/* Contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-400 italic">Correo Electrónico (No editable)</label>
          <div className="relative">
            <Mail className="absolute right-3 top-2.5 text-gray-300" size={18} />
            <input 
              readOnly
              {...register("email")}
              className="mt-1 block w-full p-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-md cursor-not-allowed"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono (10 dígitos)</label>
          <input 
            type="tel"
            {...register("phone", { 
              required: "Requerido",
              pattern: { value: /^[0-9]{10}$/, message: "Deben ser 10 dígitos numéricos" }
            })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            placeholder="5512345678"
          />
          {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone.message}</p>}
        </div>
      </div>

      {/* Código Postal y Alcaldía */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700">Código Postal (CDMX)</label>
          <div className="relative">
            <MapPin className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <input 
              {...register("postal_code", { 
                required: "Requerido",
                pattern: { 
                  value: /^(0[1-9]|1[0-6])\d{3}$/, 
                  message: "Solo se permiten CPs de CDMX (01xxx a 16xxx)" 
                }
              })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              placeholder="Ej. 07738"
            />
          </div>
          {errors.postal_code && <p className="text-red-500 text-[10px] mt-1">{errors.postal_code.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Municipio / Alcaldía</label>
          <select 
            {...register("municipality", { required: "Seleccione alcaldía" })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">Seleccione...</option>
            {Object.values(CP_ALCALDIAS).map(alc => (
              <option key={alc} value={alc}>{alc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estado y Vivienda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <input 
            readOnly
            {...register("state")}
            className="mt-1 block w-full p-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Situación de Vivienda</label>
          <select 
            {...register("home_ownership", { required: "Seleccione una opción" })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="RENT">Renta</option>
            <option value="OWN">Propia</option>
            <option value="MORTGAGE">Hipotecada</option>
            <option value="FAMILY">Familiar</option>
          </select>
        </div>
      </div>

      <div className="text-left">
        <label className="block text-sm font-medium text-gray-700">Dirección Completa (Calle y Número)</label>
        <input 
          {...register("address", { required: "Campo obligatorio" })}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          placeholder="Av. Juan de Dios Bátiz s/n"
        />
      </div>
    </div>
  );

};

export default Step1Identity;