import pandas as pd
import numpy as np
import numpy_financial as npf

# Eliminamos el diccionario PRODUCTOS de aquí, 
# ahora las políticas vendrán desde mortgage_db vía el microservicio Core.

def factor_anualidad(tasa_mensual, n):
    if np.isclose(tasa_mensual, 0.0): return 1.0 / n
    return (tasa_mensual * (1 + tasa_mensual)**n) / ((1 + tasa_mensual)**n - 1)

def seguros_y_admin(valor, politicas):
    # Extraemos los montos de seguros del JSON dinámico que viene de la DB
    seg_vida = float(politicas["seguros"]["vida"]["monto"])
    seg_danos = float(politicas["seguros"]["danos"]["monto"])
    com_admin = float(politicas["comision_admin_mensual"])
    return seg_vida, seg_danos, com_admin

# ... (mantén las funciones de avaluo_contra_cfg y notariales_contra_cfg igual)

def simular_credito(producto_cfg, usuario):
    # 'pol' ahora contiene los datos exactos que el administrador guardó en la DB
    pol = producto_cfg["politicas"]
    tipo = pol.get("tipo")
    tasas_df = pd.DataFrame(producto_cfg["tasas"])
    
    valor = float(usuario["valor_vivienda"])
    ingreso = float(usuario["ingreso_bruto"])
    plazo = int(usuario["plazo_meses"])
    
    # Lógica de enganche y crédito (se mantiene igual pero usando 'pol')
    min_pct = 0.05 if tipo in ["apoyo", "cofinavit"] else 0.10
    pct_user = float(usuario.get("pct_enganche", min_pct))
    pct_usado = max(min_pct, pct_user)
    enganche = round(valor * pct_usado, 2)
    
    credito_pre = round(min(valor - enganche, valor * float(pol.get("aforo_max", 0.90))), 2)

    # Cálculo de seguros usando la nueva función dinámica
    seg_vida, seg_danos, com_admin = seguros_y_admin(valor, pol)

    resultados = []
    for _, row in tasas_df.iterrows():
        tasa_m = row["tasa_anual_fija"] / 12.0
        f = factor_anualidad(tasa_m, plazo)
        
        # Principal (considerando comisión financiada si la política lo dice)
        com_ap = round(credito_pre * float(pol["comision_apertura_pct"]), 2)
        principal = credito_pre + (com_ap if pol.get("comision_apertura_financiada") else 0.0)
        
        mensualidad = round((principal * f) + seg_vida + seg_danos + com_admin, 2)
        ingreso_req = round(mensualidad * pol["relacion_ir"], 2)
        
        resultados.append({
            "tasa": row["nombre"],
            "tasa_pct": row["tasa_anual_fija"] * 100,
            "mensualidad": mensualidad,
            "ingreso_requerido": ingreso_req,
            "cumple": ingreso >= ingreso_req
        })
    
    df = pd.DataFrame(resultados)
    posibles = df[df["cumple"] == True]
    
    if not posibles.empty:
        seleccion = posibles.sort_values("tasa_pct").iloc[0].to_dict()
        escenario = "normal"
    else:
        seleccion = df.sort_values("tasa_pct").iloc[0].to_dict()
        escenario = "rescate"
    
    return {
        "escenario": escenario,
        "resumen": seleccion,
        "credito_banorte": credito_pre,
        "enganche": enganche
    }