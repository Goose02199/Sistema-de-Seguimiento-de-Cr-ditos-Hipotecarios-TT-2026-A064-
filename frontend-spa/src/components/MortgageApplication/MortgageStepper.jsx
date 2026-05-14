import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/api';
import { 
  User, Briefcase, Calculator, Home, History, 
  ChevronRight, ChevronLeft, Loader2, CheckCircle2, PiggyBank 
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors }, trigger } = useForm({
    defaultValues: {
      // Identidad y Vivienda (Sección 1)
      first_name: '',
      last_name: '',
      rfc_curp: '',
      birth_date: '',
      email: '',
      phone: '',
      home_ownership: 'NONE', 
      address: '',
      postal_code: '',
      state: '',
      municipality: '',

      // Laboral (Sección 2)
      employment_type: 'asalariado', 
      job_seniority_years: 0, 
      job_seniority_months: 0, 
      company_name: '',
      job_title: '',
      payroll_at_bank: false, 

      // Finanzas (Sección 3)
      monthly_income: 0, 
      monthly_expenses: 0, 
      installment: 0, 
      dti: 0,
      verification_status: 'not_verified',

      // Crédito y Propiedad (Sección 4)
      property_value: 0, 
      down_payment_pct: 10, 
      loan_amnt: 0, 
      loan_term: 20, 
      property_location: '',
      financing_type: 'bancario', 
      institute_credit_amount: '',
      housing_subaccount: 0, 

      // Buró de Crédito (Sección 5)
      revol_bal: 0,
      total_rev_hi_lim: 0, 
      revol_util: 0, 
      open_acc: 0, 
      total_acc: 0, 
      delinq_2yrs: 0,
      pub_rec: 0,
      inq_last_6mths: 0,
      earliest_cr_line_year: new Date().getFullYear(), 
      tot_cur_bal: 0, 
      tot_coll_amt: 0,  
      collections_12_mths_ex_med: 0,
      has_settlements: false,
      settlement_count: 0,
      settlement_amount: 0
    }
  });

  const clearDraft = () => {
    if (window.confirm("¿Seguro que quieres borrar el borrador y empezar de nuevo?")) {
      localStorage.removeItem(CACHE_KEY);
      reset(); // Resetea a defaultValues
      setCurrentStep(0);
      window.location.reload(); // Para asegurar limpieza total de estados
    }
  };

  const saveManualDraft = () => {
    setSaveStatus('saving');
    const currentData = watch();
    const cacheData = {
      formData: currentData,
      step: currentStep
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    
    // Efecto visual de éxito
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    }, 600);
  };

  // Dentro de MortgageStepper, después de definir useForm...
  const CACHE_KEY = `mortgage_draft_${user?.id || 'guest'}`;

  useEffect(() => {
    // Solo guardamos en caché si el usuario está llenando el formulario (pasos 0 a 4)
    if (currentStep >= 5) return; 

    const subscription = watch((value) => {
      const cacheData = {
        formData: value,
        step: currentStep
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    });
    return () => subscription.unsubscribe();
  }, [watch, currentStep, CACHE_KEY]);

  useEffect(() => {
    const initStepper = async () => {
      try {
        // 1. Cargamos al usuario (Perfil)
        const userResponse = await api.get(`/auth/me/`);
        const userData = userResponse.data;
        setUser(userData);

        // Objeto base con datos del perfil (Lo que tú llamabas initialData)
        const profileDefaults = {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          rfc_curp: userData.curp_rfc || '',
          birth_date: userData.birth_date || '',
          home_ownership: userData.housing_status || 'RENT',
          address: userData.address || '',
          postal_code: userData.postal_code || '',
          state: userData.state || '',
          municipality: userData.municipality || '',
        };

        let applicationData = null;

        try {
          // 2. Buscamos si ya existe una solicitud en la DB
          const appResponse = await api.get(`/mortgage/applications/?user_id=${userData.id}`);
          applicationData = appResponse.data;
        } catch (appError) {
          // 3. Si no existe (404), inicializamos el borrador en la nueva vista del backend
          if (appError.response?.status === 404) {
            const initRes = await api.post('/mortgage/applications/initialize/', { 
              user_id: userData.id 
            });
            applicationData = initRes.data;
          }
        }

        if (applicationData) {
          setResult(applicationData);
          setSentData(applicationData);

          // 1. Calculamos el ingreso mensual (que solo existe en React)
          const monthlyFromDB = applicationData.annual_inc ? (parseFloat(applicationData.annual_inc) / 12).toFixed(2) : 0;
          
          const savedDraft = localStorage.getItem(`mortgage_draft_${userData.id}`);
          
          // 2. Definimos la base: lo que hay en la DB
          // 3. Encima ponemos el perfil (para que "Borrador" cambie por el nombre real)
          // 4. Encima el caché (lo último que escribió el usuario)
          
          if (applicationData.status !== 'draft') {
            // CASO A: La solicitud ya se envió (IA o Broker)
            // Ignoramos y borramos el caché local porque la DB es la única verdad
            localStorage.removeItem(`mortgage_draft_${userData.id}`);
            reset({ ...applicationData, monthly_income: monthlyFromDB });
            setCurrentStep(5);
          } 
          else if (savedDraft) {
            // CASO B: Sigue en borrador y hay caché local
            const { formData, step } = JSON.parse(savedDraft);
            const mergedData = { 
              ...applicationData, 
              ...profileDefaults, 
              monthly_income: monthlyFromDB,
              ...formData // El caché gana solo si es DRAFT
            };
            reset(mergedData);
            setCurrentStep(step);
          } 
          else {
            // CASO C: Borrador nuevo sin caché
            reset({ ...applicationData, ...profileDefaults, monthly_income: monthlyFromDB });
            setCurrentStep(0);
          }
        }
      } catch (error) {
        console.error("Error en inicialización:", error);
      } finally {
        setLoading(false);
      }
    };
    initStepper();
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
      ['first_name', 'last_name', 'rfc_curp', 'birth_date', 'email', 'home_ownership', 'address','postal_code', 'state', 'municipality'],
      
      // Paso 1: Laboral (Sección 2 del PDF) [cite: 15]
      ['employment_type', 'job_seniority_years', 'job_seniority_months', 'company_name', 'job_title', 'payroll_at_bank'],
      
      // Paso 2: Finanzas (Sección 3 del PDF) [cite: 23]
      ['monthly_income', 'monthly_expenses', 'installment', 'dti', 'verification_status'],
      
      // Paso 3: Propiedad y Crédito (Sección 4 del PDF) [cite: 32]
      ['property_value', 'down_payment_pct', 'loan_amnt', 'loan_term', 'property_location','financing_type', 'institute_credit_amount','housing_subaccount'],
      
      // Paso 4: Historial de Buró (Sección 5 del PDF) [cite: 43]
      ['revol_bal', 
      'total_rev_hi_lim',
      'revol_util',
      'open_acc',
      'total_acc',
      'delinq_2yrs',
      'pub_rec',
      'inq_last_6mths',
      'earliest_cr_line_year',
      'tot_cur_bal', 
      'tot_coll_amt',  
      'collections_12_mths_ex_med',
      'has_settlements',
      'settlement_count',
      'settlement_amount']
    ];
    
    const isStepValid = await trigger(fieldsByStep[currentStep]);
    
    if (isStepValid) {
      // NUEVO: Si estamos pasando del paso 4 al 5, preparamos la data visual
      if (currentStep === 4) {
        const currentData = watch();
        setSentData({
          ...currentData,
          full_name: `${currentData.first_name} ${currentData.last_name}`.trim(),
          monthly_income: currentData.monthly_income
        });
      }
      
      setCurrentStep((prev) => prev + 1);
    }
  };
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
        const processedData = {
            ...data,
            full_name: `${data.first_name} ${data.last_name}`.trim(),
            annual_inc: parseFloat(data.monthly_income) * 12,
            loan_amnt: parseFloat(data.loan_amnt),
            property_value: parseFloat(data.property_value),
            installment: parseFloat(data.installment),
            status: 'sent_awaiting_ia', // Cambiamos el status para disparar la IA
            user_id: user.id 
        };

        // Como el registro se crea al entrar (init), aquí siempre es PATCH
        const response = await api.patch(`/mortgage/applications/`, processedData);

        localStorage.removeItem(CACHE_KEY);
        setResult(response.data);
        setSentData(response.data);
        setCurrentStep(5);

    } catch (error) {
        console.error("Error al procesar solicitud:", error.response?.data);
        const errorMsg = error.response?.data?.error || "Error al procesar tu crédito.";
        alert(errorMsg);
    } finally {
        setIsSubmitting(false);
    }
  };

  const ConfirmModal = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform animate-in zoom-in-95 duration-300">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-full">
        <CheckCircle2 className="text-[#1A4E5E]" size={32} />
      </div>
      <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
        ¿Confirmar envío de solicitud?
      </h3>
      <p className="text-center text-slate-500 mb-8">
        Una vez enviada, la IA procesará tu perfil de riesgo y se te asignará un bróker. Asegúrate de que los datos sean correctos.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => setShowConfirmModal(false)}
          className="flex-1 px-4 py-2 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
        >
          Revisar datos
        </button>
        <button
          onClick={() => {
            setShowConfirmModal(false);
            handleSubmit(onSubmit)(); // Dispara manualmente el submit de react-hook-form
          }}
          className="flex-1 px-4 py-2 font-semibold text-white bg-[#1A4E5E] rounded-xl hover:bg-[#133a46] transition-all shadow-md shadow-indigo-100"
        >
          Confirmar y Enviar
        </button>
      </div>
    </div>
  </div>
);

  // Función para habilitar edición desde ResultsView
  const handleEdit = () => {
    setCurrentStep(0); // Regresamos al inicio del formulario
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
        {currentStep === 0 && (
          <Step1Identity 
            register={register} 
            errors={errors} 
            setValue={setValue} 
            watch={watch} 
            status={result?.status}
          />
        )}
        {currentStep === 1 && ( 
          <Step2Employment 
            register={register} 
            errors={errors} 
            setValue={setValue} 
            watch={watch}
          />
        )}
        {currentStep === 2 && (
          <Step3Financial 
            register={register} 
            errors={errors} 
            watch={watch} 
            setValue={setValue} 
          />
        )}
        {currentStep === 3 && (
          <Step4Property 
            register={register} 
            errors={errors} 
            watch={watch}    
            setValue={setValue} 
          />
        )}
        {currentStep === 4 && (
          <Step5CreditHistory 
            register={register} 
            errors={errors} 
            watch={watch} 
          />
        )}
        {currentStep === 5 && (
          <ResultsView 
            sentData={sentData} 
            // Si 'result' es null (primera vez), mandamos un estado temporal
            receivedData={result || { id: 'Pendiente de envío', status: 'draft' }} 
            onEdit={handleEdit} 
          />
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
          
          {currentStep < 5 && (
            <button
              type="button"
              onClick={saveManualDraft}
              className="text-xs font-bold text-[#1A4E5E] hover:bg-slate-50 px-3 py-2 rounded-lg border border-dashed border-slate-300 flex items-center gap-2 transition-all"
            >
              {saveStatus === 'saving' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle2 size={14} className="text-green-500" />
              ) : (
                <PiggyBank size={14} /> 
              )}
              {saveStatus === 'saved' ? '¡Progreso a salvo!' : 'Guardar Borrador'}
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
                type="button" // IMPORTANTE: Cambiar de 'submit' a 'button'
                onClick={() => setShowConfirmModal(true)} // Abrir modal
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 transition-all shadow-md disabled:bg-gray-400"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Solicitud'}
              </button>
            ) : null}
          </div>
        </div>
      </form>
      {showConfirmModal && <ConfirmModal />}
    </div>
  );
};

export default MortgageStepper;