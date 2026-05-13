from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

# Motores para modelos
from .core.predictor import RiskPredictor
from .core.recommender import BankRecommender

from .engines.banorte.engine import orquestar_cotizacion_banorte
from .engines.santander.engine import orquestar_cotizacion_santander
from .engines.scotiabank.engine import orquestar_cotizacion_scotiabank

import traceback
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

class CotizacionBanorteRequest(BaseModel):
    """
    Esquema para el Cotizador de Banorte.
    Usamos Dict y List[Dict] para mantener la flexibilidad total 
    en caso de que el equipo de IA agregue nuevas variables.
    """
    datos_usuario: Dict[str, Any]
    productos_banco: List[Dict[str, Any]]

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

# ENDPOINT 3: Cotizador Analítico (Banorte)
@app.post("/cotizar/banorte")
async def cotizar_banorte(payload: CotizacionBanorteRequest):
    """
    Motor determinista de cotizaciones para Banorte.
    Recibe el perfil del cliente y las políticas de la DB inyectadas desde Django.
    """
    try:
        # Llamamos a nuestra función puente
        resultado = orquestar_cotizacion_banorte(
            datos_usuario=payload.datos_usuario,
            productos_banco=payload.productos_banco
        )
        
        # Si la función devolvió exito = False (ej. el cliente no califica)
        if not resultado.get("exito"):
            # En lugar de explotar con un error 500, devolvemos un 400 amigable
            raise HTTPException(status_code=400, detail=resultado.get("mensaje"))
            
        return resultado
        
    except Exception as e:
        print("--- ERROR EN MOTOR BANORTE ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Fallo interno en cotización Banorte: {str(e)}")

@app.post("/cotizar/santander")
async def cotizar_santander(payload: CotizacionBanorteRequest): # Puedes reusar el esquema
    try:
        resultado = orquestar_cotizacion_santander(
            datos_usuario=payload.datos_usuario,
            productos_banco=payload.productos_banco
        )
        if not resultado.get("exito"):
            raise HTTPException(status_code=400, detail=resultado.get("mensaje"))
            
        return resultado
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Fallo interno en cotización Santander: {str(e)}")

# ENDPOINT 5: Cotizador Analítico (Scotiabank)
@app.post("/cotizar/scotiabank")
async def cotizar_scotiabank(payload: CotizacionBanorteRequest): 
    try:
        resultado = orquestar_cotizacion_scotiabank(
            datos_usuario=payload.datos_usuario,
            productos_banco=payload.productos_banco
        )
        if not resultado.get("exito"):
            raise HTTPException(status_code=400, detail=resultado.get("mensaje"))
        return resultado
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Fallo interno en cotización Scotiabank: {str(e)}")