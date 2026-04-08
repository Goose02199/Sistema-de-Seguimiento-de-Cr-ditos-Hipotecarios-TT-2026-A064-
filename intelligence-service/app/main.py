from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict

# Motores para modelos
from .core.predictor import RiskPredictor
from .core.recommender import BankRecommender

import os

app = FastAPI(title="Intelligence Service - Risk Analysis - Comprehensive Engine")

# Inicialización de Predictores
risk_predictor = RiskPredictor()
bank_recommender = BankRecommender()

class ApplicantData(BaseModel):
    """Esquema para el Modelo de Riesgo (XGBoost)"""
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

class RecommendationRequest(BaseModel):
    """Esquema para el Buscador Top 5 (ExtraTrees)"""
    montoCredito: float
    plazoAnios: int
    ingresoMensual: float
    valorVivienda: float

# --- ENDPOINTS ---

@app.get("/health")
async def health_check():
    return {"status": "ready", "models": ["XGBoost_Riesgo", "ExtraTrees_Recommendation"]}

# ENDPOINT 1: Riesgo (XGBoost) 
@app.post("/analyze-risk")
async def analyze_risk(data: ApplicantData):
    """Inferencia de Machine Learning"""
    try:
        result = risk_predictor.process_and_predict(data.dict())
        return result
    except Exception as e:
        print("--- FATAL ERROR EN ML ---")
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=str(e))

# ENDPOINT 2: Recomendación Top 5 (ExtraTrees)

@app.post("/recommend-banks")
async def recommend_banks(data: RecommendationRequest):
    """
    Recibe el perfil del cliente y devuelve las 5 mejores opciones 
    calibradas y segmentadas.
    """
    try:
        results = bank_recommender.process_and_recommend(data.dict())
        return {"status": "success", "recommendations": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Recommendation Error: {str(e)}")

# --- ENDPOINT 3: MOTOR FINANCIERO (Simulación) ---
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

