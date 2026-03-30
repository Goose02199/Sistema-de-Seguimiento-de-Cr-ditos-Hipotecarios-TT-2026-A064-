import numpy as np
import pandas as pd
from numpy_financial import irr
from datetime import date  
# -------------------------
# Constantes de idioma
# -------------------------
_DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
_MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

# -------------------------
# Helpers de Formato
# -------------------------
def fecha_es(dt: date) -> str:
    """Convierte un objeto date a string en español: 'Lunes, 01 de enero de 2026'."""
    return f"{_DIAS[dt.weekday()]}, {dt.day:02d} de {_MESES[dt.month-1]} de {dt.year}"

def money(x) -> str:
    return f"${x:,.2f}"

def pct(x) -> str:
    return f"{x:.2f}%"

# -------------------------
# Finanzas (Específicas Banorte)
# -------------------------
def factor_anualidad(tasa_mensual: float, n: int) -> float:
    if np.isclose(tasa_mensual, 0.0):
        return 1.0 / n
    return (tasa_mensual * (1 + tasa_mensual)**n) / ((1 + tasa_mensual)**n - 1)

def cat_por_tir(credito_banorte, avaluo, gastos_aprob, com_apertura, politicas, mensualidad, plazo):
    """CAT aproximado vía TIR de flujos."""
    cat_cfg = politicas.get("cat", {})
    incluye_ap = bool(cat_cfg.get("incluye_apertura_financiada_t0", True))
    if politicas.get("comision_apertura_financiada", True) and not incluye_ap:
        recibido = credito_banorte - (avaluo + gastos_aprob)
    else:
        recibido = credito_banorte - (avaluo + gastos_aprob + com_apertura)
    
    flujos = [round(recibido, 2)] + [-round(mensualidad, 2)] * plazo
    tirm = irr(flujos)
    if tirm is None or np.isnan(tirm):
        return np.nan
    return (1 + tirm)**12 - 1

def seguros_y_admin(valor, politicas):
    """Cálculo de seguros y admin basado en políticas del JSON."""
    sa = round(valor * float(politicas["seguros"]["suma_asegurable_pct"]), 2)
    vida_cfg = politicas["seguros"]["vida"]
    
    # Lógica Vida
    if vida_cfg["metodo"] == "pormil":
        seg_vida = round((sa / 1000.0) * float(vida_cfg["tarifa_pormil_mensual"]), 2)
        if not np.isfinite(seg_vida):
            seg_vida = round(vida_cfg.get("monto_mensual_fijo_fallback", 0.0), 2)
    else: 
        seg_vida = round(float(vida_cfg["monto_mensual"]), 2)

    # Lógica Daños
    danos_cfg = politicas["seguros"]["danos"]
    if danos_cfg["metodo"] == "fijo":
        seg_danos = round(float(danos_cfg["monto_mensual_iva"]), 2)
    elif danos_cfg["metodo"] == "porcentaje_saldo":
        tasa_anual_danos = float(danos_cfg["tasa_anual"])
        iva_danos = float(danos_cfg["iva"])
        seg_danos = round((valor * tasa_anual_danos / 12) * (1 + iva_danos), 2)
    else:
        seg_danos = 0.0

    com_admin = round(float(politicas["comision_admin_mensual"]), 2)
    return sa, seg_vida, seg_danos, com_admin

def avaluo_contra_cfg(valor, pol):
    """Cálculo de avalúo."""
    if "avaluo_monto" in pol:
        return round(float(pol["avaluo_monto"]), 2)
    base = valor * float(pol.get("avaluo_pct_mil", 0.0))
    iva = float(pol.get("avaluo_iva_pct", 0.0))
    if base == 0 and "avaluo_monto" not in pol:
        return 5800.00
    return round(base * (1 + iva), 2)

def notariales_contra_cfg(valor, pol):
    """Cálculo de notariales."""
    not_cfg = pol["notariales"]
    if not_cfg["modo"] == "porcentaje":
        return round(valor * float(not_cfg["pct"]), 2)
    return round(float(not_cfg["monto"]), 2)

def obtener_instituto(usuario, tipo_producto):
    """Mapeo de créditos de institutos."""
    if tipo_producto == "fpt":
        fovi = usuario.get("fovissste", {}) or {}
        return ("FOVISSSTE", float(fovi.get("credito_fovissste", 0.0)), float(fovi.get("subcuenta_vivienda", 0.0)))

    if tipo_producto in ("cofinavit", "cta_infonavit"):
        info = usuario.get("infonavit", {}) or {}
        return ("INFONAVIT", float(info.get("credito_infonavit", 0.0)), float(info.get("subcuenta_vivienda", 0.0)))

    if tipo_producto == "apoyo":
        info = usuario.get("infonavit", {}) or {}
        return ("INFONAVIT", 0.0, float(info.get("subcuenta_vivienda", 0.0)))

    return ("", 0.0, 0.0)