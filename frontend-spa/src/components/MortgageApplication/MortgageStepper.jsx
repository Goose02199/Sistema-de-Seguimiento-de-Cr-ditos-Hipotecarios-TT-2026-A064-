import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/api';
import { 
  User, Briefcase, Calculator, Home, History, 
  ChevronRight, ChevronLeft, Loader2, CheckCircle2 
} from 'lucide-react';

// Importaremos los sub-pasos (que crearemos a continuación)
// import StepIdentity from './StepIdentity'; ...

const MortgageStepper = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm({
    defaultValues: {
      user_id: 1, // Esto debería venir de tu context de auth
      financing_type: 'bancario',
      home_ownership: 'RENT',
      verification_status: 'not_verified',
      loan_term: 20
    }
  });

  const steps = [
    { title: 'Identidad', icon: <User size={20} /> },
    { title: 'Laboral', icon: <Briefcase size={20} /> },
    { title: 'Finanzas', icon: <Calculator size={20} /> },
    { title: 'Propiedad', icon: <Home size={20} /> },
    { title: 'Historial', icon: <History size={20} /> },
  ];

  const nextStep = async () => {
    // Validamos solo los campos del paso actual antes de avanzar
    const fieldsByStep = [
      ['full_name', 'rfc_curp', 'email'],
      ['employment_type', 'company_name'],
      ['loan_amnt', 'annual_inc', 'installment'],
      ['property_value', 'loan_term'],
      ['dti', 'revol_util']
    ];
    
    const isStepValid = await trigger(fieldsByStep[currentStep]);
    if (isStepValid) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
         // Aseguramos que usamos el ID del usuario que AppLayout ya validó
        const finalData = { ...data, user_id: user.id }; 
        const response = await api.post('/core/applications/', finalData);
        setResult(response.data);
        setCurrentStep(5);
    } catch (error) {
      console.error("Error al procesar solicitud:", error.response?.data);
      alert("Hubo un error al procesar tu crédito. Revisa los datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Indicador de Progreso */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className={`flex flex-col items-center w-full ${index <= currentStep ? 'text-[#1A4E5E]' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 
              ${index < currentStep ? 'bg-[#1A4E5E] border-[#1A4E5E] text-white' : 
                index === currentStep ? 'border-[#1A4E5E] text-[#1A4E5E] animate-pulse' : 'border-gray-200'}`}>
              {index < currentStep ? <CheckCircle2 size={20} /> : step.icon}
            </div>
            <span className="text-xs font-medium hidden md:block">{step.title}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Aquí renderizaremos condicionalmente cada sección */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <User className="text-[#1A4E5E]" /> Datos de Identificación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <input 
                  {...register("full_name", { required: "Campo obligatorio" })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
                  placeholder="Ej. Ángel Gustavo Navarro"
                />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">RFC / CURP</label>
                <input 
                  {...register("rfc_curp", { required: "Campo obligatorio" })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-[#1A4E5E] focus:border-[#1A4E5E]"
                  placeholder="NAGA000000..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ... Resto de los pasos (1, 2, 3, 4) ... */}

        {/* Botones de Navegación */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          {currentStep > 0 && currentStep < 5 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft size={20} /> Anterior
            </button>
          )}
          
          <div className="ml-auto">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 bg-[#1A4E5E] text-white px-6 py-2 rounded-lg hover:bg-[#133a46] transition-all shadow-md"
              >
                Siguiente <ChevronRight size={20} />
              </button>
            ) : currentStep === 4 ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 transition-all shadow-md disabled:bg-gray-400"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Solicitud'}
              </button>
            ) : null}
          </div>
        </div>
      </form>
      
      {/* Vista de Resultados al Final */}
      {currentStep === 5 && result && (
        <div className="text-center py-8 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">¡Análisis Completado!</h2>
          <p className="text-gray-600 mt-2">Tu solicitud ID #{result.id} ha sido procesada por nuestros modelos de IA.</p>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg inline-block">
             <span className="text-sm text-gray-500 uppercase font-bold tracking-wider">Diagnóstico de Riesgo</span>
             <div className="text-3xl font-black text-[#1A4E5E]">{result.risk_label}</div>
          </div>
          {/* Aquí mapearíamos las recomendaciones de bancos */}
        </div>
      )}
    </div>
  );
};

export default MortgageStepper;