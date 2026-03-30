from fastapi import FastAPI, HTTPException
from .core.predictor import RiskPredictor
from pydantic import BaseModel

app = FastAPI(title="Intelligence Service - Risk Analysis - Comprehensive Engine")
predictor = RiskPredictor()

class ApplicantData(BaseModel):
    # Variables según tu lista de 22
    loan_amnt_MXN2025: float
    annual_inc_MXN2025: float
    installment_MXN2025: float
    revol_bal_MXN2025: float
    tot_cur_bal_MXN2025: float
    tot_coll_amt_MXN2025: float
    total_rev_hi_lim_MXN2025: float
    verification_status: str
    dti: float
    delinq_2yrs: int
    inq_last_6mths: int
    open_acc: int
    pub_rec: int
    total_acc: int
    revol_util: float
    home_ownership: str  # El predictor se encargará de expandir esto a las 6 columnas
    earliest_cr_line: int

@app.get("/health")
async def health_check():
    return {"status": "ready", "model": "XGBoost_Riesgo_Final"}

# --- ENDPOINT 1: MODELO DE ML (XGBoost) ---
@app.post("/analyze-risk")
async def analyze_risk(data: ApplicantData):
    """Inferencia de Machine Learning"""
    try:
        result = predictor.process_and_predict(data.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Error: {str(e)}")

# --- ENDPOINT 2: MOTOR FINANCIERO (Simulación) ---
# @app.post("/simulate")
# async def run_simulation(payload: dict):
#     """
#     Recibe el politicas_json (de mortgage-core) y los datos del usuario.
#     """
#     try:
#         # 1. Validar presencia de datos básicos
#         if 'bank_config' not in payload or 'usuario' not in payload:
#             raise HTTPException(status_code=400, detail="Faltan bank_config o usuario en el JSON")
            
#         bank_config = payload['bank_config']
#         usuario = payload['usuario']
        
#         # 2. Instanciar motor específico (Por ahora Banorte)
#         # En el futuro, el Orchestrator decidirá cuál usar según el slug del banco
#         engine = BanorteEngine(bank_config)
        
#         # 3. Ejecutar lógica de Rescate (Sección 4 del Notebook)
#         resultado = engine.ejecutar_rescate_banorte(usuario)
        
#         if not resultado:
#             return {
#                 "status": "rejected",
#                 "message": "Capacidad de pago insuficiente incluso con 30% de enganche."
#             }
            
#         return {
#             "status": "success",
#             "data": resultado
#         }
        
#     except Exception as e:
#         import traceback
#         print(traceback.format_exc())
#         raise HTTPException(status_code=500, detail=f"Engine Error: {str(e)}")

