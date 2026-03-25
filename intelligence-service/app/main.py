from fastapi import FastAPI, HTTPException
from .core.predictor import RiskPredictor
from pydantic import BaseModel
from .finance_engine import simular_credito

app = FastAPI(title="Intelligence Service - Risk Analysis - Comprehensive Engine")
predictor = RiskPredictor()

# Definimos el esquema de entrada para validación automática
class ApplicantData(BaseModel):
    loan_amnt_MXN2025: float
    annual_inc_MXN2025: float
    dti: float
    verification_status: str
    home_ownership: str
    earliest_cr_line: int
    # Puedes agregar las 22 variables aquí o usar un dict genérico para pruebas
    inq_last_6mths: int = 0
    delinq_2yrs: int = 0
    pub_rec: int = 0
    open_acc: int = 0
    total_acc: int = 0
    revol_util: float = 0.0

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
@app.post("/simulate")
async def run_simulation(payload: dict):
    """Cálculo Matemático Financiero Dinámico"""
    try:
        # Extraemos lo que el Mortgage Core leyó de la DB
        producto_cfg = {
            "politicas": payload['politicas'],
            "tasas": payload['politicas']['tasas']
        }
        usuario = payload['usuario']
        
        resultado = simular_credito(producto_cfg, usuario)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation Error: {str(e)}")

