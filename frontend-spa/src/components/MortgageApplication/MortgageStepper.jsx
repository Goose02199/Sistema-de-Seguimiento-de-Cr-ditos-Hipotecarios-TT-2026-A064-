import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/api';
import { 
  User, Briefcase, Calculator, Home, History, 
  ChevronRight, ChevronLeft, Loader2, CheckCircle2 
} from 'lucide-react';

// Importaremos los sub-pasos (que crearemos a continuación)

import Step1Identity from './Step1Identity';
import Step2Employment from './Step2Employment';
import Step3Financial from './Step3Financial';
import Step4Property from './Step4Property';
import Step5CreditHistory from './Step5CreditHistory';
import ResultsView from './ResultsView';


const MortgageStepper = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [sentData, setSentData] = useState(null);

  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors }, trigger } = useForm({
    defaultValues: {
      // Identidad y Vivienda (Sección 1)
      first_name: '',
      last_name: '',
      rfc_curp: '',
      birth_date: '',
      email: '',
      phone: '',
      home_ownership: 'RENT', 
      postal_code: '',

      // Laboral (Sección 2)
      employment_type: 'asalariado', 
      job_seniority: 0, 
      company_name: '',
      job_title: '',
      payroll_at_bank: false, 

      // Finanzas (Sección 3)
      monthly_income: 0, 
      monthly_expenses: 0, 
      installment: 0, 
      verification_status: 'not_verified',

      // Crédito y Propiedad (Sección 4)
      property_value: 0, 
      down_payment_pct: 10, 
      loan_amnt: 0, 
      loan_term: 20, 
      financing_type: 'bancario', 
      housing_subaccount: 0, 

      // Buró de Crédito (Sección 5)
      revol_bal: 0,
      total_rev_hi_lim: 0, 
      revol_util: 0, 
      open_acc: 0, 
      total_acc: 0, 
      delinq_2yrs: 0, 
      inq_last_6mths: 0,
      earliest_cr_line_year: new Date().getFullYear(), 
      tot_cur_bal: 0, 
      tot_coll_amt: 0,  
      has_settlements: false,
      collections_12_mths_ex_med: 0 
    }
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/auth/me/`);
        const userData = response.data;
        setUser(userData);
        
        // 3. Rehidratamos el formulario con los datos del servidor 
        reset({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          rfc_curp: userData.curp_rfc || '', // Mapeo de nombre de campo
          home_ownership: userData.housing_status || 'RENT',
          postal_code: userData.postal_code || '',
          birth_date: userData.birth_date || '',
        });
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [reset]);

  const steps = [
    { title: 'Identidad', icon: <User size={20} /> },
    { title: 'Laboral', icon: <Briefcase size={20} /> },
    { title: 'Finanzas', icon: <Calculator size={20} /> },
    { title: 'Propiedad', icon: <Home size={20} /> },
    { title: 'Historial', icon: <History size={20} /> },
  ];

  const nextStep = async () => {
    const fieldsByStep = [
      // Paso 0: Identidad y Vivienda (Sección 1 del PDF) [cite: 4]
      ['first_name', 'last_name', 'rfc_curp', 'birth_date', 'email', 'home_ownership', 'postal_code'],
      
      // Paso 1: Laboral (Sección 2 del PDF) [cite: 15]
      ['employment_type', 'job_seniority', 'company_name', 'job_title'],
      
      // Paso 2: Finanzas (Sección 3 del PDF) [cite: 23]
      ['monthly_income', 'monthly_expenses', 'installment', 'verification_status'],
      
      // Paso 3: Propiedad y Crédito (Sección 4 del PDF) [cite: 32]
      ['property_value', 'down_payment_pct', 'loan_amnt', 'loan_term', 'financing_type'],
      
      // Paso 4: Historial de Buró (Sección 5 del PDF) [cite: 43]
      ['revol_bal', 'total_rev_hi_lim', 'revol_util', 'open_acc', 'delinq_2yrs', 'earliest_cr_line_year']
    ];
    
    const isStepValid = await trigger(fieldsByStep[currentStep]);
    if (isStepValid) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
        // 1. Transformación de datos según especificaciones técnicas
        const processedData = {
            ...data,
            // Unión de identidad: Nombres + Apellidos [cite: 6]
            full_name: `${data.first_name} ${data.last_name}`.trim(),
            
            // Cálculo de Ingreso Anual para el modelo XGBoost (Mensual * 12) [cite: 25, 30]
            annual_inc: parseFloat(data.monthly_income) * 12,
            
            // Asegurar tipos de datos numéricos para los modelos de ML [cite: 3, 24]
            loan_amnt: parseFloat(data.loan_amnt),
            property_value: parseFloat(data.property_value),
            installment: parseFloat(data.installment),
            
            // Asociación del usuario autenticado
            user_id: user.id 
        };

        setSentData(processedData);

        // 2. Limpieza de campos temporales del formulario
        delete processedData.first_name;
        delete processedData.last_name;
        delete processedData.monthly_income; // Ya se transformó a annual_inc 

        // 3. Envío al microservicio Core (Puerto 8001 vía Gateway)
        const response = await api.post('/mortgage/applications/', processedData);
        
        // 4. Persistencia de resultados de IA (Riesgo y Recomendación) [cite: 61, 64]
        setResult(response.data);
        setCurrentStep(5); // Ir a vista de éxito/resultados

    } catch (error) {
        console.error("Error al procesar solicitud:", error.response?.data);
        const errorMsg = error.response?.data?.detail || "Hubo un error al procesar tu crédito. Revisa los datos.";
        alert(errorMsg);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-[#1A4E5E]" size={40} />
      <span className="ml-3 text-gray-500">Cargando perfil...</span>
    </div>
  );

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
        {currentStep === 0 && <Step1Identity register={register} errors={errors} />}
        {currentStep === 1 && <Step2Employment register={register} errors={errors} />}
        {currentStep === 2 && <Step3Financial register={register} errors={errors} />}
        {currentStep === 3 && (
          <Step4Property 
            register={register} 
            errors={errors} 
            watch={watch}    
            setValue={setValue} 
          />
        )}
        {currentStep === 4 && <Step5CreditHistory register={register} errors={errors} />}
        {currentStep === 5 && result && (
          <ResultsView sentData={sentData} receivedData={result} />
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
    </div>
  );
};

export default MortgageStepper;