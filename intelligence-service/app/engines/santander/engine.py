# =====================================================
# Seccion 1: LIBRERÍAS, CONSTANTES Y HELPERS (SANTANDER)
# =====================================================
import copy
import pandas as pd
import numpy as np
from datetime import date
from numpy_financial import irr

# -------------------------
# Constantes de idioma
# -------------------------
_DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
_MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

def fecha_es(dt: date) -> str:
    return f"{_DIAS[dt.weekday()]}, {dt.day:02d} de {_MESES[dt.month-1]} de {dt.year}"

def money(x) -> str:
    return f"${x:,.2f}"

def pct(x) -> str:
    return f"{x:.2f}%"

# -------------------------
# Finanzas
# -------------------------
def factor_anualidad(tasa_mensual: float, n: int) -> float:
    """
    Factor de anualidad para pagos fijos.
    """
    if np.isclose(tasa_mensual, 0.0):
        return 1.0 / n
    return (tasa_mensual * (1 + tasa_mensual)**n) / ((1 + tasa_mensual)**n - 1)

def cat_por_tir(credito_banco, avaluo, gastos_aprob, com_apertura, politicas, mensualidad, plazo):
    """
    CAT aproximado vía TIR de flujos:
    t0 = monto neto recibido por el cliente,
    t1..tN = mensualidad total (capital + intereses + seguros + comisiones).
    """
    incluye_ap = bool(politicas.get("cat", {}).get("incluye_apertura_financiada_t0", True))
    com_financiada = bool(politicas.get("comision_apertura_financiada", True))

    if com_financiada and not incluye_ap:
        recibido = credito_banco - (avaluo + gastos_aprob)
    else:
        recibido = credito_banco - (avaluo + gastos_aprob + com_apertura)

    flujos = [round(recibido, 2)] + [-round(mensualidad, 2)] * int(plazo)
    tirm = irr(flujos)
    if tirm is None or np.isnan(tirm):
        return np.nan
    return (1 + tirm)**12 - 1


# -------------------------
# Seguros, avalúo y notariales
# -------------------------
def seguros_y_admin(valor_inmueble: float, politicas: dict):
    """
    Calcula suma asegurable, seguro de vida, seguro de daños
    y comisión administrativa mensual según las políticas.

    Soporta:
    - Seguros cobrados al cliente (Tradicional):
        vida: metodo = 'pormil' o 'monto'
        daños: metodo = 'pormil' o 'monto'
    - Seguros incluidos (Free):
        seguros['modo'] = 'incluidos' -> todos en 0 para el cliente.
    """
    seg_cfg = politicas.get("seguros", {})
    modo_general = seg_cfg.get("modo", "cobrados")

    # Por defecto, suma asegurable = valor * pct (ej. 0.70)
    suma_pct = float(seg_cfg.get("suma_asegurable_pct", 0.0))
    sa = round(valor_inmueble * suma_pct, 2)

    if modo_general == "incluidos":
        # Hipoteca Free: el cliente no paga seguros
        seg_vida = 0.0
        seg_danos = 0.0
    else:
        # ----- Seguro de vida -----
        vida_cfg = seg_cfg.get("vida", {})
        metodo_vida = vida_cfg.get("metodo", "pormil")

        if metodo_vida == "pormil":
            tarifa = float(vida_cfg.get("tarifa_pormil_mensual", 0.0))
            seg_vida = round((sa / 1000.0) * tarifa, 2)
            if not np.isfinite(seg_vida):
                seg_vida = round(vida_cfg.get("monto_mensual_fijo_fallback", 0.0), 2)
        else:  # 'monto'
            seg_vida = round(float(vida_cfg.get("monto_mensual", 0.0)), 2)

        # ----- Seguro de daños -----
        danos_cfg = seg_cfg.get("danos", {})
        metodo_d = danos_cfg.get("metodo", "pormil")

        if metodo_d == "pormil":
            tarifa_d = float(danos_cfg.get("tarifa_pormil_mensual", 0.0))
            seg_danos = round((sa / 1000.0) * tarifa_d, 2)
        else:  # 'monto'
            seg_danos = round(float(danos_cfg.get("monto_mensual_iva", 0.0)), 2)

    com_admin = round(float(politicas.get("comision_admin_mensual", 0.0)), 2)
    return sa, seg_vida, seg_danos, com_admin


def avaluo_contra_cfg(valor_inmueble: float, pol: dict) -> float:
    """
    Calcula el avalúo conforme a la configuración:

    - Si existe 'avaluo_monto' -> se usa ese valor fijo.
    - Si existe 'avaluo_pct_mil' -> se calcula (valor * pct) + IVA.
    - Si no hay config, fallback típico de Santander ~ 6,000.
    """
    if "avaluo_monto" in pol:
        return round(float(pol["avaluo_monto"]), 2)

    base = valor_inmueble * float(pol.get("avaluo_pct_mil", 0.0))
    iva = float(pol.get("avaluo_iva_pct", 0.0))

    if base == 0 and "avaluo_monto" not in pol:
        # Fallback aproximado (ej. para vivienda alrededor de 2M)
        return 6000.00
    return round(base * (1 + iva), 2)


def notariales_contra_cfg(valor_inmueble: float, pol: dict) -> float:
    """
    Calcula gastos notariales conforme a la configuración.

    - modo = 'porcentaje' -> valor * pct (ej. 0.07).
    - modo = 'monto'      -> monto fijo.
    """
    not_cfg = pol["notariales"]
    if not_cfg["modo"] == "porcentaje":
        return round(valor_inmueble * float(not_cfg["pct"]), 2)
    return round(float(not_cfg["monto"]), 2)


# -------------------------
# Instituto (INFONAVIT / COFINAVIT)
# -------------------------
def obtener_instituto(usuario: dict, tipo_producto: str):
    """
    Devuelve (nombre_instituto, credito_inst, subcuenta).

    Versión adaptada a Santander:

    - 'apoyo'        -> solo subcuenta INFONAVIT (sin crédito activo).
    - 'cofinavit'    -> crédito INFONAVIT + subcuenta.
    - otros (adquisición pura, free, etc.) -> sin instituto.
    """
    info_inf = usuario.get("infonavit", {}) or {}

    if tipo_producto == "cofinavit":
        return (
            "INFONAVIT",
            float(info_inf.get("credito_infonavit", 0.0)),
            float(info_inf.get("subcuenta_vivienda", 0.0))
        )

    if tipo_producto == "apoyo":
        # Apoyo INFONAVIT: no hay crédito activo, solo subcuenta como garantía
        return (
            "INFONAVIT",
            0.0,
            float(info_inf.get("subcuenta_vivienda", 0.0))
        )

    # Adquisición normal / Free sin INFONAVIT
    return ("", 0.0, 0.0)


# ---------------------------------
# Estimador sencillo de perfil (1–5)
# Usa edad, enganche (LTV) y capacidad de pago
# ---------------------------------
def estimar_perfil_santander(usuario: dict) -> int:
    """
    Estima un perfil de 1 a 5 para tasas Santander.

    NO es el algoritmo real del banco, solo una aproximación razonable
    usando:
      - edad
      - porcentaje de enganche (LTV)
      - capacidad de pago: ingreso / mensualidad aproximada
    """
    edad = int(usuario.get("edad", 35))
    ingreso = float(usuario.get("ingreso_bruto", 0.0))
    valor = float(usuario.get("valor_vivienda", 0.0))
    pct_enganche = float(usuario.get("pct_enganche", 0.10))
    plazo_meses = int(usuario.get("plazo_meses", 240))

    # ---------- 1) Puntaje por edad ----------
    if 30 <= edad <= 45:
        p_edad = 1.0
    elif 25 <= edad < 30 or 45 < edad <= 55:
        p_edad = 0.8
    elif 21 <= edad < 25 or 55 < edad <= 65:
        p_edad = 0.6
    else:
        p_edad = 0.4

    # ---------- 2) Puntaje por LTV (relación préstamo/valor) ----------
    ltv = 1.0 - pct_enganche  # ej. 0.90 si enganche 10%

    if ltv <= 0.70:         # enganche >= 30%
        p_ltv = 1.0
    elif ltv <= 0.80:       # enganche 20–30
        p_ltv = 0.85
    elif ltv <= 0.90:       # enganche 10–20
        p_ltv = 0.70
    else:                   # enganche < 10 (en teoría no permitido)
        p_ltv = 0.50

    # ---------- 3) Puntaje por capacidad de pago ----------
    # Mensualidad aproximada con una tasa media de 11.5%
    tasa_med_anual = 0.115
    tasa_mensual = tasa_med_anual / 12.0
    credito_est = valor * ltv
    n = max(plazo_meses, 1)
    fa = factor_anualidad(tasa_mensual, n)
    mens_aprox = credito_est * fa if credito_est > 0 else 0.0

    if mens_aprox <= 0:
        p_cap = 0.4
    else:
        ratio = ingreso / mens_aprox
        if ratio >= 4:
            p_cap = 1.0
        elif ratio >= 3:
            p_cap = 0.9
        elif ratio >= 2:
            p_cap = 0.75
        elif ratio >= 1.5:
            p_cap = 0.6
        else:
            p_cap = 0.4

    # ---------- 4) Score combinado ----------
    score = 0.4 * p_edad + 0.3 * p_ltv + 0.3 * p_cap

    if score >= 0.90:
        perfil = 5
    elif score >= 0.80:
        perfil = 4
    elif score >= 0.68:
        perfil = 3
    elif score >= 0.55:
        perfil = 2
    else:
        perfil = 1

    return perfil


# =====================================================
# Seccion 3: CÁLCULOS BASE (MENSUALIDAD Y TOPES) – SANTANDER
# =====================================================

def _mensualidad_total(
    credito: float,
    tasa_anual: float,
    plazo: int,
    adders: float,
    pol: dict,
    subcuenta: float = 0.0,
    tipo_producto: str = "adquisicion",
) -> float:
    """
    Mensualidad total Santander:

    - Calcula comisión de apertura (si existe).
    - Puede financiar la apertura en el crédito.
    - En productos de 'apoyo', la subcuenta INFONAVIT
      abate capital (se resta del principal financiado).
    - Suma seguros y comisiones mensuales en 'adders'.

    mensualidad = pago(cap+intereses) + adders
    Se redondea a peso entero.
    """
    apertura_pct = float(pol.get("comision_apertura_pct", 0.0))
    apertura_fin = bool(pol.get("comision_apertura_financiada", False))

    com_ap = credito * apertura_pct
    principal = credito + (com_ap if apertura_fin and apertura_pct > 0 else 0.0)

    # Apoyo INFONAVIT: la subcuenta se usa para abatir capital
    if tipo_producto == "apoyo" and subcuenta > 0:
        aplicar = min(subcuenta, principal)
        principal = max(0.0, principal - aplicar)

    tasa_m = float(tasa_anual) / 12.0
    f = factor_anualidad(tasa_m, int(plazo))
    cap_int = principal * f

    m_total = cap_int + float(adders)
    # Redondeo Santander (a peso)
    return float(np.floor(m_total + 0.5))


def _credito_tope_estructura(
    valor: float,
    enganche: float,
    credito_inst: float,
    subcuenta: float,
    pol: dict,
    tipo_producto: str,
) -> float:
    """
    Tope de crédito Santander por estructura y políticas de aforo.

    Usa:
      - aforo_max_banco: límite de % del valor que puede financiar Santander.
      - aforo_total_max: límite combinado Banco + INFONAVIT + subcuenta (solo cofinavit).

    Reglas por tipo:

    - 'adquisicion' / 'free' / 'apoyo':
        base_banco = valor - enganche

    - 'cofinavit':
        base_banco = valor - (enganche + credito_inst + subcuenta)

      luego:
        credito_banco <= valor * aforo_max_banco
        y si hay aforo_total_max:
        credito_banco + credito_inst + subcuenta <= valor * aforo_total_max
    """
    aforo_max_banco = float(pol.get("aforo_max_banco", 0.90))
    aforo_total_max = pol.get("aforo_total_max", None)

    # -------------------------------
    # 1) Estructura base por producto
    # -------------------------------
    if tipo_producto == "cofinavit":
        base_banco = max(0.0, valor - (enganche + credito_inst + subcuenta))
    else:  # adquisicion / free / apoyo
        base_banco = max(0.0, valor - enganche)

    # Límite por aforo propio de Santander
    credito_top = min(base_banco, valor * aforo_max_banco)

    # -----------------------------------------
    # 2) Límite por aforo TOTAL (cofinavit solo)
    # -----------------------------------------
    if aforo_total_max is not None and tipo_producto == "cofinavit" and credito_inst > 0:
        # Banco + instituto + subcuenta <= valor * aforo_total_max
        max_banco_por_total = valor * float(aforo_total_max) - credito_inst - subcuenta
        credito_top = min(credito_top, max(0.0, max_banco_por_total))

    return round(max(0.0, credito_top), 2)

# =====================================================
# Seccion 4: RESCATE (MANIPULACIÓN DE ENGANCHE) – SANTANDER
# =====================================================

def ingreso_minimo_requerido(mensualidad: float, politicas: dict) -> float:
    """
    Calcula el ingreso mínimo requerido para una mensualidad dada,
    usando la relación ingreso/mensualidad de Santander.

    Por defecto usa 1.82 (obtenido del simulador oficial):
        ingreso_min = mensualidad * 1.82
    """
    factor = float(politicas.get("relacion_ingreso_mensualidad", 1.81818))
    return mensualidad * factor


def rescate_por_enganche_santander(
    usuario: dict,
    producto: dict,
    adders: float,
    credito_inst: float,
    subcuenta: float,
    enganche_max_pct: float = 0.30,
    delta_enganche_pct: float = 0.02,
    tol_mxn: float = 50.0,
):
    """
    Modo RESCATE para productos Santander.

    Si con el enganche actual del usuario la mensualidad NO cabe
    en su ingreso (según la relación ingreso/mensualidad del producto),
    esta función aumenta el enganche en pasos delta_enganche_pct
    hasta encontrar un escenario que sí cumpla.

    Parámetros:
    ----------
    usuario : dict
        Debe contener al menos:
            - 'valor_vivienda'
            - 'ingreso_bruto'
            - 'pct_enganche'  (0.10 = 10%)
            - 'plazo_meses'
            - (opcional) 'edad', 'sexo'  -> usados por fn_tasa

    producto : dict
        Uno de los PRODUCTOS_SANTANDER, con claves:
            - 'tipo'       : 'adquisicion', 'apoyo', 'cofinavit', 'free'
            - 'politicas'  : diccionario de políticas
            - 'fn_tasa'    : función que recibe usuario y devuelve dict con
                             'tasa_anual_fija'

    adders : float
        Suma mensual de:
            seguro de vida + seguro de daños + comisión admin
        (ya calculados con seguros_y_admin()).

    credito_inst : float
        Monto de crédito del instituto (sólo cofinavit, INFONAVIT).

    subcuenta : float
        Saldo de subcuenta de vivienda (apoyo / cofinavit).

    enganche_max_pct : float
        Tope máximo de porcentaje de enganche a considerar en el rescate.
        Ejemplo: 0.30 -> 30% del valor del inmueble.

    delta_enganche_pct : float
        Paso en puntos porcentuales para ir aumentando el enganche.
        Ejemplo: 0.02 -> se prueba 10%, 12%, 14%, ...

    tol_mxn : float
        Tolerancia en pesos: se acepta una mensualidad ligeramente
        por arriba del tope, hasta +tol_mxn.

    Devuelve:
    --------
    dict o None

    Si encuentra solución:
        {
            'pct_enganche_nuevo': % enganche que hace viable el crédito,
            'enganche_nuevo'    : monto de enganche en MXN,
            'credito_max'       : crédito Santander compatible,
            'mens_compatible'   : mensualidad resultante,
            'ingreso_minimo'    : ingreso mínimo requerido con esa mensualidad,
            'tasa_anual'        : tasa anual usada (ya con perfil)
        }

    Si no hay forma de que alcance ni subiendo al enganche_max_pct:
        devuelve None.
    """
    valor = float(usuario.get("valor_vivienda", 0.0))
    ingreso_usuario = float(usuario.get("ingreso_bruto", 0.0))
    plazo = int(usuario.get("plazo_meses", 240))
    pct_enganche_usuario = float(usuario.get("pct_enganche", 0.10))

    if valor <= 0 or ingreso_usuario <= 0:
        return None

    politicas = producto.get("politicas", {})
    tipo_producto = politicas.get("tipo", producto.get("tipo", ""))

    # Relación ingreso/mensualidad (≈ 1.82 según simulador Santander)
    factor_ir = float(politicas.get("relacion_ingreso_mensualidad", 1.82))
    mensualidad_tope = ingreso_usuario / factor_ir

    # Respetar mínimo de enganche del producto
    enganche_min_pct = float(politicas.get("enganche_min_pct", 0.10))
    pct_actual = max(pct_enganche_usuario, enganche_min_pct)
    pct_actual = min(pct_actual, enganche_max_pct)

    # Tasa del producto para ESTE usuario (ya incluye perfil 1–5)
    perfil = estimar_perfil_santander(usuario)
    tasa_info = producto.get("tasas_perfil", {}).get(str(perfil), {})
    tasa_anual = float(tasa_info.get("tasa", 0.0))

    mejor = None

    while pct_actual <= enganche_max_pct + 1e-9:
        enganche = round(valor * pct_actual, 2)

        credito_top = _credito_tope_estructura(
            valor=valor,
            enganche=enganche,
            credito_inst=credito_inst,
            subcuenta=subcuenta,
            pol=politicas,
            tipo_producto=tipo_producto,
        )

        if credito_top <= 0:
            pct_actual += delta_enganche_pct
            continue

        m = _mensualidad_total(
            credito=credito_top,
            tasa_anual=tasa_anual,
            plazo=plazo,
            adders=adders,
            pol=politicas,
            subcuenta=subcuenta,
            tipo_producto=tipo_producto,
        )

        # ¿Cabe en el ingreso del usuario?
        if m <= mensualidad_tope + tol_mxn:
            ingreso_min = ingreso_minimo_requerido(m, politicas)
            mejor = {
                "pct_enganche_nuevo": pct_actual,
                "enganche_nuevo": enganche,
                "credito_max": credito_top,
                "mens_compatible": m,
                "ingreso_minimo": ingreso_min,
                "tasa_anual": tasa_anual,
            }
            break

        pct_actual += delta_enganche_pct

    return mejor

# =====================================================
# Seccion 5: COTIZAR PRODUCTO SANTANDER + GENERAR COTIZACIONES
# =====================================================

def cotizar_producto_santander(producto: dict, usuario: dict, tol_mxn: float = 50.0):
    """
    Cotiza un producto Santander (Tradicional, Apoyo, Cofinavit, Free)
    para un usuario dado.
    """
    pol = producto.get("politicas", {})
    tipo_producto = pol.get("tipo", producto.get("tipo", ""))
    valor = float(usuario.get("valor_vivienda", 0.0))
    ingreso = float(usuario.get("ingreso_bruto", 0.0))
    plazo = int(usuario.get("plazo_meses", 240))

    if valor <= 0 or ingreso <= 0:
        return None

    # Enganche
    enganche_min_pct = float(pol.get("enganche_min_pct", 0.10))
    user_pct_e = float(usuario.get("pct_enganche", enganche_min_pct))

    pct_e_usado = max(user_pct_e, enganche_min_pct)
    enganche = round(valor * pct_e_usado, 2)

    if user_pct_e < enganche_min_pct:
        motivo_enganche = f"Enganche ajustado al mínimo del producto ({enganche_min_pct*100:.0f}%)."
    elif user_pct_e > enganche_min_pct:
        motivo_enganche = f"Se respetó enganche ingresado ({user_pct_e*100:.1f}%)."
    else:
        motivo_enganche = f"Enganche igual al mínimo del producto ({enganche_min_pct*100:.0f}%)."

    # Instituto
    if tipo_producto in ("apoyo", "cofinavit"):
        nombre_inst, credito_inst, subcuenta = obtener_instituto(usuario, tipo_producto)
    else:
        nombre_inst, credito_inst, subcuenta = ("", 0.0, 0.0)

    # Crédito máximo Santander
    credito_pre = _credito_tope_estructura(
        valor=valor, enganche=enganche, credito_inst=credito_inst,
        subcuenta=subcuenta, pol=pol, tipo_producto=tipo_producto,
    )
    credito_pre = max(0.0, round(credito_pre, 2))
    if credito_pre <= 0:
        return None

    # Costos fijos y Seguros
    avaluo = avaluo_contra_cfg(valor, pol)
    gastos_not = notariales_contra_cfg(valor, pol)
    gastos_aprob = float(pol.get("gastos_aprobacion", 0.0))
    com_ap_pre = round(credito_pre * float(pol.get("comision_apertura_pct", 0.0)), 2)
    sa, seg_vida, seg_danos, com_admin = seguros_y_admin(valor, pol)
    adders = seg_vida + seg_danos + com_admin

    # Tasa
    perfil = estimar_perfil_santander(usuario) 
    tasa_info = producto.get("tasas_perfil", {}).get(str(perfil), {})
    nombre_tasa = tasa_info.get("nombre", f"Perfil {perfil}")
    tasa_anual = float(tasa_info.get("tasa", 0.0)) 
    tasa_anual_pct = tasa_anual * 100.0

    # Mensualidad "Normal"
    mensualidad = _mensualidad_total(
        credito=credito_pre, tasa_anual=tasa_anual, plazo=plazo, adders=adders,
        pol=pol, subcuenta=subcuenta, tipo_producto=tipo_producto,
    )
    ingreso_req = round(ingreso_minimo_requerido(mensualidad, pol), 2)

    cat = cat_por_tir(
        credito_banco=credito_pre, avaluo=avaluo, gastos_aprob=gastos_aprob,
        com_apertura=com_ap_pre, politicas=pol, mensualidad=mensualidad, plazo=plazo,
    )
    cat_pct = (round(cat * 100, 1) if pd.notna(cat) else np.nan)

    # Verificar capacidad de pago
    factor_ir = float(pol.get("relacion_ingreso_mensualidad", 1.82))
    mensualidad_tope = ingreso / factor_ir

    if mensualidad <= mensualidad_tope + tol_mxn:
        aforo_banco = (credito_pre / valor) if valor > 0 else 0.0
        aforo_inst = (credito_inst / valor) if (valor > 0 and credito_inst > 0) else 0.0

        pago_total_mens = round(mensualidad * plazo, 2)
        desembolso_inicial = round(enganche + avaluo + gastos_not + gastos_aprob, 2)
        costo_total = round(desembolso_inicial + pago_total_mens, 2)

        return {
            "modo": "Normal",
            "producto": producto["nombre"],
            "tasa_nombre": nombre_tasa,
            "tasa_anual_pct": round(tasa_anual_pct, 2),
            "cat_pct": cat_pct,
            "mensualidad": mensualidad,
            "ingreso_req": ingreso_req,
            "seguro_vida": seg_vida,
            "seguro_danos": seg_danos,
            "comision_admin": com_admin,
            "credito_banco": round(credito_pre, 2),
            "credito_instituto": credito_inst,
            "subcuenta_vivienda": subcuenta,
            "enganche": enganche,
            "pct_enganche": pct_e_usado,
            "avaluo": avaluo,
            "gastos_notariales": gastos_not,
            "gastos_aprobacion": gastos_aprob,
            "comision_apertura": com_ap_pre,
            "desembolso_inicial": desembolso_inicial,
            "pago_total_mensualidades": pago_total_mens,
            "costo_total_cliente": costo_total,
            "plazo": plazo,
            "valor_vivienda": valor,
            "aforo_banco_pct": round(aforo_banco * 100, 2),
            "aforo_instituto_pct": round(aforo_inst * 100, 2),
            "aforo_total_pct": round((aforo_banco + aforo_inst) * 100, 2),
            "nota_enganche": motivo_enganche,
            "nombre_instituto": nombre_inst,
        }

    # =====================================================
    # Si NO cumple → RESCATE POR ENGANCHE
    # =====================================================
    resc = rescate_por_enganche_santander(
        usuario=usuario, producto=producto, adders=adders,
        credito_inst=credito_inst, subcuenta=subcuenta,
        enganche_max_pct=0.30, delta_enganche_pct=0.02, tol_mxn=tol_mxn,
    )

    if resc is None:
        return None

    pct_enganche_final = float(resc["pct_enganche_nuevo"])
    enganche_final = float(resc["enganche_nuevo"])
    credito_final = float(resc["credito_max"])
    mensualidad2 = float(resc["mens_compatible"])
    ingreso_req2 = float(resc["ingreso_minimo"])
    tasa_anual_resc_pct = float(resc["tasa_anual"]) * 100.0

    com_ap_final = round(credito_final * float(pol.get("comision_apertura_pct", 0.0)), 2)

    cat_resc = cat_por_tir(
        credito_banco=credito_final, avaluo=avaluo, gastos_aprob=gastos_aprob,
        com_apertura=com_ap_final, politicas=pol, mensualidad=mensualidad2, plazo=plazo,
    )
    cat_resc_pct = (round(cat_resc * 100, 1) if pd.notna(cat_resc) else np.nan)

    desembolso2 = round(enganche_final + avaluo + gastos_not + gastos_aprob, 2)
    pago_total_mens2 = round(mensualidad2 * plazo, 2)
    costo_total2 = round(desembolso2 + pago_total_mens2, 2)

    aforo_banco2 = (credito_final / valor) if valor > 0 else 0.0
    aforo_inst2 = (credito_inst / valor) if (valor > 0 and credito_inst > 0) else 0.0

    nota_rescate = f"Enganche aumentado a {pct_enganche_final*100:.1f}% para cumplir capacidad de pago." if pct_enganche_final > pct_e_usado + 1e-9 else "Ajustado para cumplir capacidad de pago."

    return {
        "modo": "Rescate",
        "producto": producto["nombre"],
        "tasa_nombre": nombre_tasa,
        "tasa_anual_pct": round(tasa_anual_resc_pct, 2),
        "cat_pct": cat_resc_pct,
        "mensualidad": mensualidad2,
        "ingreso_req": ingreso_req2,
        "seguro_vida": seg_vida,
        "seguro_danos": seg_danos,
        "comision_admin": com_admin,
        "credito_banco": round(credito_final, 2),
        "credito_instituto": credito_inst,
        "subcuenta_vivienda": subcuenta,
        "enganche": enganche_final,
        "pct_enganche": pct_enganche_final,
        "avaluo": avaluo,
        "gastos_notariales": gastos_not,
        "gastos_aprobacion": gastos_aprob,
        "comision_apertura": com_ap_final,
        "desembolso_inicial": desembolso2,
        "pago_total_mensualidades": pago_total_mens2,
        "costo_total_cliente": costo_total2,
        "plazo": plazo,
        "valor_vivienda": valor,
        "aforo_banco_pct": round(aforo_banco2 * 100, 2),
        "aforo_instituto_pct": round(aforo_inst2 * 100, 2),
        "aforo_total_pct": round((aforo_banco2 + aforo_inst2) * 100, 2),
        "nota_enganche": nota_rescate,
        "nombre_instituto": nombre_inst,
    }


def generar_cotizaciones_santander(productos: list, usuario: dict, tol_mxn: float = 50.0):
    """
    Genera todas las cotizaciones Santander para un usuario,
    recorriendo la lista PRODUCTOS_SANTANDER.

    A diferencia de Banorte:
    - NO recorre una lista de tasas.
    - Cada producto trae su propia fn_tasa(usuario) que ya incorpora el perfil.

    Devuelve:
    - lista de dicts (una cotización por producto viable).
    """
    cotizaciones = []
    for prod in productos:
        cot = cotizar_producto_santander(prod, usuario, tol_mxn=tol_mxn)
        if cot is not None:
            cotizaciones.append(cot)
    return cotizaciones

# =====================================================
# Seccion 6: SALIDAS USUARIO Y BROKER (TODAS LAS COTIZACIONES) – SANTANDER
# =====================================================

def salida_usuario_all(df_all: pd.DataFrame) -> pd.DataFrame:
    """
    Salida compacta para usuario final. Columnas (orden pensada para cliente):

    - Producto
    - Mensualidad
    - Pago inicial
    - Tasa
    - CAT
    - Crédito Santander
    - Pago total
    """
    if df_all is None or df_all.empty:
        return df_all

    out = df_all.copy()

    # Formatos amigables
    out["Tasa"] = out["tasa_anual_pct"].map(lambda x: f"{x:.2f}%")
    out["CAT"] = out["cat_pct"].map(lambda x: ("ND" if pd.isna(x) else f"{x:.1f}%"))
    out["Crédito Santander"] = out["credito_banco"].map(money)
    out["Mensualidad"] = out["mensualidad"].map(money)
    out["Pago inicial"] = out["desembolso_inicial"].map(money)
    out["Pago total"] = out["costo_total_cliente"].map(money)

    out = out.rename(columns={"producto": "Producto"})

    cols = [
        "Producto",
        "Mensualidad",
        "Pago inicial",
        "Tasa",
        "CAT",
        "Crédito Santander",
        "Pago total",
    ]
    cols = [c for c in cols if c in out.columns]
    return out[cols]


def salida_broker_all(df_all: pd.DataFrame) -> pd.DataFrame:
    """
    Salida robusta para broker. Incluye desglose completo de costos y seguros.
    """
    if df_all is None or df_all.empty:
        return df_all

    out = df_all.copy()

    # Formatos amigables
    out["Tasa"] = out["tasa_anual_pct"].map(lambda x: f"{x:.2f}%")
    out["CAT"] = out["cat_pct"].map(lambda x: ("ND" if pd.isna(x) else f"{x:.1f}%"))
    out["Mensualidad"] = out["mensualidad"].map(money)
    out["Ingreso requerido"] = out["ingreso_req"].map(money)
    
    # Nuevos campos de desglose mensual
    if "seguro_vida" in out.columns: out["Seguro de Vida"] = out["seguro_vida"].map(money)
    if "seguro_danos" in out.columns: out["Seguro de Daños"] = out["seguro_danos"].map(money)
    if "comision_admin" in out.columns: out["Comisión Admin."] = out["comision_admin"].map(money)

    # Nuevos campos de estructura
    out["Crédito Santander"] = out["credito_banco"].map(money)
    if "credito_instituto" in out.columns: out["Crédito Instituto"] = out["credito_instituto"].map(money)
    if "subcuenta_vivienda" in out.columns: out["Subcuenta Vivienda"] = out["subcuenta_vivienda"].map(money)
    out["Enganche"] = out["enganche"].map(money)
    out["% Enganche"] = out["pct_enganche"].map(lambda x: f"{x*100:.2f}%")
    
    # Nuevos campos de costos iniciales
    out["Pago inicial"] = out["desembolso_inicial"].map(money)
    if "avaluo" in out.columns: out["Avalúo"] = out["avaluo"].map(money)
    if "gastos_notariales" in out.columns: out["Gastos Notariales"] = out["gastos_notariales"].map(money)
    if "gastos_aprobacion" in out.columns: out["Gastos Aprobación"] = out["gastos_aprobacion"].map(money)
    if "comision_apertura" in out.columns: out["Comisión Apertura"] = out["comision_apertura"].map(money)

    out["Pago total mensualidades"] = out["pago_total_mensualidades"].map(money)
    out["Costo total"] = out["costo_total_cliente"].map(money)

    # Aforos
    if "aforo_banco_pct" in out.columns:
        out["Aforo Banco"] = out["aforo_banco_pct"].map(lambda x: f"{x:.2f}%")
    if "aforo_instituto_pct" in out.columns:
        out["Aforo Instituto"] = out["aforo_instituto_pct"].map(lambda x: f"{x:.2f}%")
    if "aforo_total_pct" in out.columns:
        out["Aforo Total"] = out["aforo_total_pct"].map(lambda x: f"{x:.2f}%")

    # Renombrar columnas base
    ren = {
        "producto": "Producto",
        "tasa_nombre": "Nombre tasa",
        "plazo": "Plazo (meses)",
        "valor_vivienda": "Valor Vivienda",
    }
    out = out.rename(columns=ren)

    # El orden en el que React dibujará las filas de la tabla
    cols = [
        # Identificación
        "Producto", "Nombre tasa", "Tasa", "CAT", "modo",
        # Desglose Mensual
        "Mensualidad", "Seguro de Vida", "Seguro de Daños", "Comisión Admin.", "Ingreso requerido",
        # Estructura del financiamiento
        "Valor Vivienda", "Crédito Santander", "Crédito Instituto", "Subcuenta Vivienda", "Enganche", "% Enganche",
        "Aforo Banco", "Aforo Instituto", "Aforo Total",
        # Desglose Pago Inicial
        "Pago inicial", "Avalúo", "Gastos Notariales", "Gastos Aprobación", "Comisión Apertura",
        # Totales
        "Pago total mensualidades", "Costo total",
        "Plazo (meses)",
        # Notas
        "nota_enganche",
        "nombre_instituto",
    ]

    cols_final = [c for c in cols if c in out.columns]
    return out[cols_final]

# -----------------------------------------------------
# Ordenador opcional de cotizaciones
# -----------------------------------------------------
def ordenar_cotizaciones(cotizaciones):
    """
    Ordena TODAS las cotizaciones por:
    1) mensualidad ascendente
    2) tasa anual ascendente
    3) costo total ascendente
    """
    if not cotizaciones:
        return pd.DataFrame()

    df = pd.DataFrame(cotizaciones)
    df_sorted = df.sort_values(
        by=["mensualidad", "tasa_anual_pct", "costo_total_cliente"],
        ascending=[True, True, True]
    ).reset_index(drop=True)

    return df_sorted


# =====================================================
# ELECCIÓN DE PRODUCTOS SEGÚN EL PERFIL DEL USUARIO
# =====================================================

def productos_para_usuario_santander(usuario: dict, productos_disponibles_db: list) -> list:
    """
    Filtra los productos de Santander basándose en si el usuario tiene Infonavit.
    Santander NO maneja Fovissste en este cotizador.
    """
    tiene_inf = bool(usuario.get("tiene_infonavit", False))
    lista = []

    for prod in productos_disponibles_db:
        # Extraemos la política para saber el tipo de producto
        politicas = prod.get("politicas", {})
        tipo = politicas.get("tipo", prod.get("tipo", ""))

        if tipo in ["adquisicion", "free"]:
            lista.append(prod)
        elif tipo in ["apoyo", "cofinavit"] and tiene_inf:
            lista.append(prod)

    return lista

# =====================================================
# FUNCIÓN MAESTRA PARA LA API (SANTANDER)
# =====================================================

def orquestar_cotizacion_santander(datos_usuario: dict, productos_banco: list) -> dict:
    """
    Función puente entre FastAPI y el motor de Santander.
    """
    # 1. Filtramos qué productos aplican
    productos_viables = productos_para_usuario_santander(datos_usuario, productos_banco)
    
    # 2. Generamos las cotizaciones
    todas_las_cotizaciones = generar_cotizaciones_santander(productos_viables, datos_usuario, tol_mxn=50.0)
    
    if not todas_las_cotizaciones:
        return {
            "exito": False,
            "mensaje": "No se encontraron cotizaciones viables para este perfil en Santander.",
            "data_usuario": [],
            "data_broker": []
        }
        
    # 3. Ordenamos usando la lógica de los Data Scientists
    df_all = ordenar_cotizaciones(todas_las_cotizaciones)
    
    # 4. Formateamos salidas
    df_usuario = salida_usuario_all(df_all)
    df_broker = salida_broker_all(df_all)
    
    return {
        "exito": True,
        "mensaje": "Cotizaciones Santander generadas exitosamente.",
        "data_usuario": df_usuario.to_dict(orient="records"),
        "data_broker": df_broker.to_dict(orient="records")
    }