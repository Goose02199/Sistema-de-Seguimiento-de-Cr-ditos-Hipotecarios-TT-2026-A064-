
# =====================================================
# Seccion 1: LIBRERÍAS, CONSTANTES Y HELPERS
# =====================================================

import copy
import pandas as pd
import numpy as np
from datetime import date
from numpy_financial import irr


# -------------------------
# Constantes de idioma
# -------------------------
_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


def fecha_es(dt: date) -> str:
    return f"{_DIAS[dt.weekday()]}, {dt.day:02d} de {_MESES[dt.month - 1]} de {dt.year}"


def money(x) -> str:
    return f"${x:,.2f}"


def pct(x) -> str:
    return f"{x:.2f}%"


# -------------------------
# Helpers financieros base
# -------------------------
def factor_anualidad(tasa_mensual: float, n: int) -> float:
    """
    Factor de anualidad ordinaria.
    """
    if np.isclose(tasa_mensual, 0.0):
        return 1.0 / n
    return (tasa_mensual * (1 + tasa_mensual) ** n) / ((1 + tasa_mensual) ** n - 1)


def pago_base_mensual_credito(principal: float, tasa_anual: float, plazo_meses: int) -> float:
    """
    Calcula el pago base mensual del componente crédito
    usando anualidad fija como base.
    """
    tasa_m = tasa_anual / 12.0
    f = factor_anualidad(tasa_m, plazo_meses)
    return principal * f


# -------------------------
# Flujos mensuales
# -------------------------
def flujo_mensual_fijo(
    principal: float,
    tasa_anual: float,
    plazo_meses: int,
    seguros_mensuales: float = 0.0
) -> list:
    """
    Flujo mensual total para productos de pago fijo,
    por ejemplo: Pagos Oportunos.
    """
    pago_base = pago_base_mensual_credito(principal, tasa_anual, plazo_meses)

    pagos = []
    for _ in range(plazo_meses):
        pago_total_mes = round(pago_base + seguros_mensuales, 2)
        pagos.append(pago_total_mes)

    return pagos


def flujo_valora_mensualidades(
    principal: float,
    tasa_anual: float,
    plazo_meses: int,
    incremento_anual: float,
    seguros_mensuales: float = 0.0
) -> list:
    """
    Genera el flujo mensual total del crédito Valora.
    Supuesto de modelado:
    - se calcula un pago base mensual del crédito
    - ese pago crece cada 12 meses según incremento_anual
    - a cada mes se le suman seguros/comisiones mensuales
    """
    pago_base = pago_base_mensual_credito(principal, tasa_anual, plazo_meses)

    pagos = []
    for mes in range(1, plazo_meses + 1):
        anio_idx = (mes - 1) // 12
        pago_credito_mes = pago_base * ((1 + incremento_anual) ** anio_idx)
        pago_total_mes = round(pago_credito_mes + seguros_mensuales, 2)
        pagos.append(pago_total_mes)

    return pagos


def flujo_producto_scotia(
    principal: float,
    tasa_anual: float,
    plazo_meses: int,
    tipo_flujo: str,
    seguros_mensuales: float = 0.0,
    incremento_anual: float = 0.0
) -> list:
    """
    Dispatcher de flujos para productos Scotiabank.

    tipo_flujo:
    - 'fijo'       -> Pagos Oportunos
    - 'creciente'  -> Valora
    """
    if tipo_flujo == "fijo":
        return flujo_mensual_fijo(
            principal=principal,
            tasa_anual=tasa_anual,
            plazo_meses=plazo_meses,
            seguros_mensuales=seguros_mensuales
        )

    if tipo_flujo == "creciente":
        return flujo_valora_mensualidades(
            principal=principal,
            tasa_anual=tasa_anual,
            plazo_meses=plazo_meses,
            incremento_anual=incremento_anual,
            seguros_mensuales=seguros_mensuales
        )

    raise ValueError(f"tipo_flujo no reconocido: {tipo_flujo}")


# -------------------------
# CAT por TIR
# -------------------------
def cat_por_tir_flujo_variable(
    credito_banco: float,
    avaluo: float,
    comision_contratacion: float,
    politicas: dict,
    flujo_mensual: list
) -> float:
    """
    CAT aproximado vía TIR para flujo variable.
    También funciona para flujo fijo.

    t0 = recibido neto por el cliente
    t1..tn = pagos mensuales
    """
    incluye_comision_t0 = bool(
        politicas["cat"].get("incluye_comision_contratacion_t0", True)
    )

    if incluye_comision_t0:
        recibido = credito_banco - (avaluo + comision_contratacion)
    else:
        recibido = credito_banco - avaluo

    flujos = [round(recibido, 2)] + [-round(x, 2) for x in flujo_mensual]
    tirm = irr(flujos)

    if tirm is None or np.isnan(tirm):
        return np.nan

    return (1 + tirm) ** 12 - 1


# -------------------------
# Seguros y cargos mensuales
# -------------------------
def seguros_y_admin_scotia(valor_vivienda: float, politicas: dict):
    """
    Seguros aproximados para productos Scotiabank.
    Por ahora se usan montos fijos mensuales para:
    - seguro de vida
    - seguro de daños
    - comisión administrativa mensual (si existiera)

    Más adelante se puede reemplazar por una lógica basada en:
    - saldo insoluto
    - valor destructible
    """
    seguros_cfg = politicas["seguros"]

    seg_vida = float(seguros_cfg["vida"]["monto_mensual"])
    seg_danos = float(seguros_cfg["danos"]["monto_mensual"])
    com_admin = float(politicas.get("comision_admin_mensual", 0.0))

    return round(seg_vida, 2), round(seg_danos, 2), round(com_admin, 2)


# Compatibilidad con el nombre que ya traías para Valora
def seguros_y_admin_valora(valor_vivienda: float, politicas: dict):
    return seguros_y_admin_scotia(valor_vivienda, politicas)


# -------------------------
# Gastos de originación
# -------------------------
def avaluo_scotia(pol: dict) -> float:
    return round(float(pol["avaluo_monto"]), 2)


def impuestos_y_derechos(valor: float, pol: dict) -> float:
    return round(valor * float(pol["impuestos_pct"]), 2)


def honorarios_notariales(valor: float, pol: dict) -> float:
    return round(valor * float(pol["notariales_pct"]), 2)


def comision_contratacion(credito: float, pol: dict) -> float:
    return round(credito * float(pol["comision_contratacion_pct"]), 2)


# -------------------------
# Métricas auxiliares
# -------------------------
def pago_al_millar_desde_mensualidad(mensualidad: float, credito: float) -> float:
    """
    Calcula el pago al millar observado a partir de la mensualidad total.
    """
    if credito <= 0:
        return np.nan
    return round((mensualidad / credito) * 1000, 2)


def ingreso_requerido_desde_relacion_ir(mensualidad: float, relacion_ir: float) -> float:
    """
    Calcula el ingreso requerido a partir de la mensualidad
    y la relación ingreso requerida por política.
    """
    return round(mensualidad * relacion_ir, 2)



# =====================================================
# Seccion 3: CÁLCULOS BASE (MENSUALIDAD Y TOPES)
# =====================================================

def _credito_tope_scotia(valor_vivienda: float, enganche: float, aforo_max: float) -> float:
    """
    Tope de crédito por estructura y aforo para productos Scotiabank.
    """
    estructural = max(0.0, valor_vivienda - enganche)
    aforo = valor_vivienda * aforo_max
    return round(min(estructural, aforo), 2)


# Compatibilidad con el nombre anterior
def _credito_tope_valora(valor_vivienda: float, enganche: float, aforo_max: float) -> float:
    return _credito_tope_scotia(valor_vivienda, enganche, aforo_max)


def _flujo_total_scotia(
    credito: float,
    tasa_anual: float,
    plazo: int,
    pol: dict,
    incremento_anual: float = 0.0
) -> tuple:
    """
    Devuelve:
    - flujo mensual total
    - mensualidad inicial
    - pago base crédito
    - seguros mensuales totales

    Funciona para:
    - Valora (tipo_flujo='creciente')
    - Pagos Oportunos (tipo_flujo='fijo')
    """
    seg_vida, seg_danos, com_admin = seguros_y_admin_scotia(0.0, pol)
    adders = seg_vida + seg_danos + com_admin

    principal = credito
    if pol.get("comision_contratacion_financiada", False):
        principal += comision_contratacion(credito, pol)

    tipo_flujo = pol.get("tipo_flujo", "fijo")

    flujo = flujo_producto_scotia(
        principal=principal,
        tasa_anual=tasa_anual,
        plazo_meses=plazo,
        tipo_flujo=tipo_flujo,
        seguros_mensuales=adders,
        incremento_anual=incremento_anual
    )

    pago_base = pago_base_mensual_credito(principal, tasa_anual, plazo)
    mensualidad_inicial = round(flujo[0], 2)

    return flujo, mensualidad_inicial, round(pago_base, 2), round(adders, 2)


# Compatibilidad con el nombre anterior
def _flujo_total_valora(
    credito: float,
    tasa_anual: float,
    plazo: int,
    incremento_anual: float,
    pol: dict
) -> tuple:
    return _flujo_total_scotia(
        credito=credito,
        tasa_anual=tasa_anual,
        plazo=plazo,
        pol=pol,
        incremento_anual=incremento_anual
    )


def _ingreso_requerido(mensualidad: float, pol: dict) -> float:
    """
    Ingreso mínimo requerido según la relación IR del producto.
    """
    return ingreso_requerido_desde_relacion_ir(
        mensualidad=mensualidad,
        relacion_ir=float(pol["relacion_ir"])
    )


def _resolver_plazo_banda(usuario: dict, banda_cfg: dict) -> int:
    """
    Determina el plazo a usar en meses.

    Reglas:
    - Si la banda define 'plazo_meses', ese manda.
    - Si no, usa el plazo del usuario.
    """
    if "plazo_meses" in banda_cfg and banda_cfg["plazo_meses"] is not None:
        return int(banda_cfg["plazo_meses"])
    return int(usuario["plazo_meses"])


def _enganche_usuario_respetando_minimo(valor_vivienda: float, pct_usuario: float, pct_minimo: float) -> tuple:
    """
    Devuelve:
    - porcentaje de enganche usado
    - monto de enganche
    """
    pct_e_usado = max(float(pct_usuario), float(pct_minimo))
    enganche = round(valor_vivienda * pct_e_usado, 2)
    return pct_e_usado, enganche


def _gastos_originacion_scotia(valor_vivienda: float, credito: float, pol: dict) -> dict:
    """
    Calcula todos los gastos de originación y regresa un diccionario.
    """
    imp = impuestos_y_derechos(valor_vivienda, pol)
    nots = honorarios_notariales(valor_vivienda, pol)
    aval = avaluo_scotia(pol)
    com_ctr = comision_contratacion(credito, pol)

    gastos_originacion = round(imp + nots + aval + com_ctr, 2)

    return {
        "impuestos": imp,
        "honorarios_notariales": nots,
        "avaluo": aval,
        "comision_contratacion": com_ctr,
        "gastos_originacion": gastos_originacion
    }


def _metricas_totales_scotia(enganche: float, gastos_originacion: float, flujo: list) -> tuple:
    """
    Devuelve:
    - inversion_cliente
    - pago_total_mensualidades
    - costo_total_cliente
    """
    inversion_cliente = round(enganche + gastos_originacion, 2)
    pago_total_mensualidades = round(sum(flujo), 2)
    costo_total_cliente = round(inversion_cliente + pago_total_mensualidades, 2)

    return inversion_cliente, pago_total_mensualidades, costo_total_cliente

# =====================================================
# Seccion 4: RESCATE MANIPULACION ENGANCHE
# =====================================================

def rescate_por_enganche_scotia(
    valor_vivienda: float,
    enganche_inicial: float,
    ingreso_usuario: float,
    plazo: int,
    pol: dict,
    banda_cfg: dict,
    tol_mxn: float = 50.0
):
    """
    Aumenta el enganche hasta encontrar una estructura compatible con la
    capacidad de pago para una banda específica de Scotiabank.

    Soporta:
    - Valora (flujo creciente)
    - Pagos Oportunos (flujo fijo)

    Evalúa la mensualidad inicial del flujo resultante.
    """
    if valor_vivienda <= 0:
        return None

    relacion_ir = float(pol["relacion_ir"])
    mensualidad_tope = float(ingreso_usuario) / relacion_ir

    enganche_min_pct = float(banda_cfg["enganche_min_pct"])
    enganche_max_pct = float(pol.get("enganche_max_rescate_pct", 0.30))
    delta_enganche_pct = float(pol.get("delta_enganche_pct", 0.02))

    tasa_anual = float(banda_cfg["tasa_anual_fija"])
    aforo_max = float(banda_cfg["aforo_max"])
    incremento_anual = float(banda_cfg.get("incremento_anual_pct", 0.0))

    pct_usuario = enganche_inicial / valor_vivienda
    pct_actual = max(pct_usuario, enganche_min_pct)
    pct_actual = min(pct_actual, enganche_max_pct)

    mejores = []

    pct = pct_actual
    while pct <= enganche_max_pct + 1e-9:
        enganche = round(valor_vivienda * pct, 2)
        credito_top = _credito_tope_scotia(valor_vivienda, enganche, aforo_max)

        if credito_top < float(pol["credito_minimo"]):
            pct += delta_enganche_pct
            continue

        flujo, mensualidad_inicial, pago_base, adders = _flujo_total_scotia(
            credito=credito_top,
            tasa_anual=tasa_anual,
            plazo=plazo,
            pol=pol,
            incremento_anual=incremento_anual
        )

        if mensualidad_inicial <= mensualidad_tope + tol_mxn:
            mejores.append({
                "tasa_nombre": banda_cfg["nombre"],
                "tasa_anual_pct": round(tasa_anual * 100, 2),
                "pct_enganche_nuevo": pct,
                "enganche_nuevo": enganche,
                "credito_max": credito_top,
                "mens_compatible": mensualidad_inicial,
                "incremento_anual_pct": round(incremento_anual * 100, 2),
                "plazo_meses": plazo
            })
            break

        pct += delta_enganche_pct

    if not mejores:
        return None

    df = pd.DataFrame(mejores).sort_values(
        by=["mens_compatible", "tasa_anual_pct", "credito_max"],
        ascending=[True, True, False]
    ).reset_index(drop=True)

    return df.iloc[0], df


# -----------------------------------------------------
# Alias de compatibilidad con tu versión previa
# -----------------------------------------------------
def rescate_por_enganche_valora(
    valor_vivienda: float,
    enganche_inicial: float,
    ingreso_usuario: float,
    plazo: int,
    pol: dict,
    banda_cfg: dict,
    tol_mxn: float = 50.0
):
    return rescate_por_enganche_scotia(
        valor_vivienda=valor_vivienda,
        enganche_inicial=enganche_inicial,
        ingreso_usuario=ingreso_usuario,
        plazo=plazo,
        pol=pol,
        banda_cfg=banda_cfg,
        tol_mxn=tol_mxn
    )

# =====================================================
# Seccion 5: COTIZAR POR TASA + GENERAR COTIZACIONES
# =====================================================

def _cotizar_scotia_por_banda(producto_cfg, usuario, banda_cfg, tol_mxn=50.0):
    pol = copy.deepcopy(producto_cfg["politicas"])

    valor = float(usuario["valor_vivienda"])
    ingreso = float(usuario["ingreso_bruto"])
    plazo = int(usuario["plazo_meses"])

    if valor < float(pol["valor_minimo_inmueble"]):
        return None

    tasa_a = float(banda_cfg["tasa_anual_fija"])
    aforo_max = float(banda_cfg["aforo_max"])
    enganche_min_pct = float(banda_cfg.get("enganche_min_pct", 0.05))
    incremento_anual = float(banda_cfg.get("incremento_anual_pct", 0.0))

    # Enganche del usuario respetando mínimo de la banda
    user_pct_e = float(usuario.get("pct_enganche", enganche_min_pct))
    pct_e_usado = max(user_pct_e, enganche_min_pct)
    enganche = round(valor * pct_e_usado, 2)

    credito_pre = _credito_tope_scotia(valor, enganche, aforo_max)
    if credito_pre < float(pol["credito_minimo"]):
        return None

    # Costos de originación
    gastos = _gastos_originacion_scotia(valor, credito_pre, pol)
    imp = gastos["impuestos"]
    nots = gastos["honorarios_notariales"]
    aval = gastos["avaluo"]
    com_ctr = gastos["comision_contratacion"]
    gastos_originacion = gastos["gastos_originacion"]

    # Extraemos explícitamente los seguros para el desglose
    seg_vida, seg_danos, com_admin = seguros_y_admin_scotia(valor, pol)

    # Flujo del producto (Valora o Pagos Oportunos)
    flujo, mensualidad_inicial, pago_base, adders = _flujo_total_scotia(
        credito=credito_pre,
        tasa_anual=tasa_a,
        plazo=plazo,
        pol=pol,
        incremento_anual=incremento_anual
    )

    ingreso_req = _ingreso_requerido(mensualidad_inicial, pol)

    # CAT
    cat = cat_por_tir_flujo_variable(
        credito_banco=credito_pre, avaluo=aval, comision_contratacion=com_ctr,
        politicas=pol, flujo_mensual=flujo
    )
    cat_pct = round(cat * 100, 1) if pd.notna(cat) else np.nan

    # Pago al millar
    pago_millar = round((mensualidad_inicial / credito_pre) * 1000, 2)

    # Totales
    inversion_cliente, pago_total_mensualidades, costo_total_cliente = _metricas_totales_scotia(
        enganche, gastos_originacion, flujo
    )

    # ¿Cumple normal?
    mensualidad_tope = ingreso / float(pol["relacion_ir"])
    if mensualidad_inicial <= mensualidad_tope + tol_mxn:
        return {
            "modo": "Normal",
            "producto": producto_cfg["nombre"],
            "tasa_nombre": banda_cfg["nombre"],
            "tasa_anual_pct": round(tasa_a * 100, 2),
            "cat_pct": cat_pct,
            "mensualidad": mensualidad_inicial,
            "pago_base_credito": pago_base,
            "seguro_vida": seg_vida,
            "seguro_danos": seg_danos,
            "comision_admin": com_admin,
            "ingreso_req": ingreso_req,
            "credito_banco": round(credito_pre, 2),
            "enganche": enganche,
            "pct_enganche": pct_e_usado,
            "desembolso_inicial": inversion_cliente,
            "pago_total_mensualidades": pago_total_mensualidades,
            "costo_total_cliente": costo_total_cliente,
            "plazo": plazo,
            "valor_vivienda": valor,
            "aforo_pct": round((credito_pre / valor) * 100, 2),
            "incremento_anual_pct": round(incremento_anual * 100, 2),
            "pago_millar": pago_millar,
            "pago_millar_ref": banda_cfg.get("pago_millar_ref", np.nan),
            "cat_ref_pct": banda_cfg.get("cat_ref_pct", np.nan),
            "impuestos": imp,
            "honorarios_notariales": nots,
            "avaluo": aval,
            "comision_contratacion": com_ctr,
            "gastos_originacion": gastos_originacion,
            "flujo_mensual": flujo,
            "nota_enganche": (
                f"Enganche mínimo aplicado: {enganche_min_pct*100:.2f}%. "
                f"Aforo máximo: {aforo_max*100:.2f}%. "
                f"Incremento: {incremento_anual*100:.2f}%."
            )
        }

    # ===========================================
    # RESCATE POR ENGANCHE
    # ===========================================
    out = rescate_por_enganche_scotia(
        valor_vivienda=valor, enganche_inicial=enganche, ingreso_usuario=ingreso,
        plazo=plazo, pol=pol, banda_cfg=banda_cfg, tol_mxn=tol_mxn
    )

    if out is None:
        return None

    sel, _ranking = out
    enganche_final = float(sel["enganche_nuevo"])
    pct_enganche_final = float(sel["pct_enganche_nuevo"])
    credito_final = float(sel["credito_max"])

    gastos2 = _gastos_originacion_scotia(valor, credito_final, pol)
    imp2 = gastos2["impuestos"]
    nots2 = gastos2["honorarios_notariales"]
    aval2 = gastos2["avaluo"]
    com_ctr2 = gastos2["comision_contratacion"]
    gastos_originacion2 = gastos2["gastos_originacion"]

    flujo2, mensualidad_inicial2, pago_base2, adders2 = _flujo_total_scotia(
        credito=credito_final, tasa_anual=tasa_a, plazo=plazo, pol=pol, incremento_anual=incremento_anual
    )

    ingreso_req2 = _ingreso_requerido(mensualidad_inicial2, pol)

    cat2 = cat_por_tir_flujo_variable(
        credito_banco=credito_final, avaluo=aval2, comision_contratacion=com_ctr2,
        politicas=pol, flujo_mensual=flujo2
    )
    cat2_pct = round(cat2 * 100, 1) if pd.notna(cat2) else np.nan

    inversion_cliente2, pago_total_mensualidades2, costo_total_cliente2 = _metricas_totales_scotia(
        enganche_final, gastos_originacion2, flujo2
    )

    pago_millar2 = round((mensualidad_inicial2 / credito_final) * 1000, 2)
    
    return {
        "modo": "Rescate",
        "producto": producto_cfg["nombre"],
        "tasa_nombre": banda_cfg["nombre"],
        "tasa_anual_pct": round(tasa_a * 100, 2),
        "cat_pct": cat2_pct,
        "mensualidad": mensualidad_inicial2,
        "pago_base_credito": pago_base2,
        "seguro_vida": seg_vida,
        "seguro_danos": seg_danos,
        "comision_admin": com_admin,
        "ingreso_req": ingreso_req2,
        "credito_banco": round(credito_final, 2),
        "enganche": enganche_final,
        "pct_enganche": pct_enganche_final,
        "desembolso_inicial": inversion_cliente2,
        "pago_total_mensualidades": pago_total_mensualidades2,
        "costo_total_cliente": costo_total_cliente2,
        "plazo": plazo,
        "valor_vivienda": valor,
        "aforo_pct": round((credito_final / valor) * 100, 2),
        "incremento_anual_pct": round(incremento_anual * 100, 2),
        "pago_millar": pago_millar2,
        "pago_millar_ref": banda_cfg.get("pago_millar_ref", np.nan),
        "cat_ref_pct": banda_cfg.get("cat_ref_pct", np.nan),
        "impuestos": imp2,
        "honorarios_notariales": nots2,
        "avaluo": aval2,
        "comision_contratacion": com_ctr2,
        "gastos_originacion": gastos_originacion2,
        "flujo_mensual": flujo2,
        "nota_enganche": (
            f"Rescate aplicado: enganche aumentado a {pct_enganche_final*100:.2f}%. "
            f"Aforo máximo: {aforo_max*100:.2f}%. "
            f"Incremento: {incremento_anual*100:.2f}%."
        )
    }

def generar_cotizaciones_scotia(producto_cfg, usuario, tol_mxn=50.0):
    todas = []
    plazo_usuario = int(usuario["plazo_meses"])

    for banda in producto_cfg["tasas"]:
        # Si la banda define un plazo específico, debe coincidir con el del usuario
        if "plazo_meses" in banda and banda["plazo_meses"] is not None:
            if int(banda["plazo_meses"]) != plazo_usuario:
                continue

        cot = _cotizar_scotia_por_banda(producto_cfg, usuario, banda, tol_mxn=tol_mxn)
        if cot is not None:
            todas.append(cot)

    return todas


def ordenar_cotizaciones(cotizaciones):
    if not cotizaciones:
        return pd.DataFrame()

    df = pd.DataFrame(cotizaciones)
    return df.sort_values(
        by=["mensualidad", "tasa_anual_pct", "costo_total_cliente"],
        ascending=[True, True, True]
    ).reset_index(drop=True)

# =====================================================
# Seccion 6: SALIDAS USUARIO Y BROKER (TODAS LAS COTIZACIONES)
# =====================================================

def salida_usuario_all(df_all: pd.DataFrame) -> pd.DataFrame:
    if df_all is None or df_all.empty:
        return df_all

    out = df_all.copy()
    out["Tasa"] = out["tasa_anual_pct"].map(lambda x: f"{x:.2f}%")
    out["CAT"] = out["cat_pct"].map(lambda x: "ND" if pd.isna(x) else f"{x:.1f}%")
    out["Mensualidad inicial"] = out["mensualidad"].map(money)
    out["Pago inicial"] = out["desembolso_inicial"].map(money)
    out["Crédito Banco"] = out["credito_banco"].map(money)
    out["Pago total"] = out["costo_total_cliente"].map(money)
    out["Incremento anual"] = out["incremento_anual_pct"].map(lambda x: f"{x:.2f}%")

    out = out.rename(columns={
        "producto": "Producto",
        "tasa_nombre": "Escenario / Banda"
    })

    cols = [
        "Producto",
        "Escenario / Banda",
        "Tasa",
        "CAT",
        "Mensualidad inicial",
        "Incremento anual",
        "Crédito Banco",
        "Pago inicial",
        "Pago total"
    ]
    return out[cols]


def salida_broker_all(df_all: pd.DataFrame) -> pd.DataFrame:
    if df_all is None or df_all.empty:
        return df_all

    out = df_all.copy()

    out["Tasa"] = out["tasa_anual_pct"].map(lambda x: f"{x:.2f}%")
    out["CAT"] = out["cat_pct"].map(lambda x: "ND" if pd.isna(x) else f"{x:.1f}%")
    out["Mensualidad inicial"] = out["mensualidad"].map(money)
    
    # Nuevos campos de desglose mensual
    if "pago_base_credito" in out.columns: out["Pago a Capital e Intereses"] = out["pago_base_credito"].map(money)
    if "seguro_vida" in out.columns: out["Seguro de Vida"] = out["seguro_vida"].map(money)
    if "seguro_danos" in out.columns: out["Seguro de Daños"] = out["seguro_danos"].map(money)
    if "comision_admin" in out.columns: out["Comisión Admin."] = out["comision_admin"].map(money)
    
    out["Ingreso requerido"] = out["ingreso_req"].map(money)
    out["Crédito Banco"] = out["credito_banco"].map(money)
    out["Enganche"] = out["enganche"].map(money)
    out["% Enganche"] = out["pct_enganche"].map(lambda x: f"{x*100:.2f}%")
    out["Pago inicial"] = out["desembolso_inicial"].map(money)
    out["Pago total mensualidades"] = out["pago_total_mensualidades"].map(money)
    out["Costo total"] = out["costo_total_cliente"].map(money)
    out["Aforo"] = out["aforo_pct"].map(lambda x: f"{x:.2f}%")
    out["Incremento anual"] = out["incremento_anual_pct"].map(lambda x: f"{x:.2f}%")
    out["Pago al millar"] = out["pago_millar"].map(lambda x: f"${x:,.2f}")
    out["Pago al millar ref"] = out["pago_millar_ref"].map(lambda x: f"${x:,.2f}")
    out["Impuestos y derechos"] = out["impuestos"].map(money)
    out["Honorarios notariales"] = out["honorarios_notariales"].map(money)
    out["Avalúo"] = out["avaluo"].map(money)
    out["Comisión contratación"] = out["comision_contratacion"].map(money)
    out["Gastos originación"] = out["gastos_originacion"].map(money)

    out = out.rename(columns={
        "producto": "Producto",
        "tasa_nombre": "Escenario / Banda",
        "plazo": "Plazo (meses)",
        "valor_vivienda": "Valor vivienda",
        "modo": "Modo"
    })

    cols = [
        # Identificación
        "Producto", "Escenario / Banda", "Modo", "Tasa", "CAT",
        # Desglose Mensualidad
        "Mensualidad inicial", "Pago a Capital e Intereses", "Seguro de Vida", "Seguro de Daños", "Comisión Admin.", "Ingreso requerido",
        # Estructura del crédito
        "Valor vivienda", "Crédito Banco", "Enganche", "% Enganche", "Aforo",
        # Indicadores Scotiabank
        "Incremento anual", "Pago al millar", "Pago al millar ref",
        # Desglose Pago Inicial
        "Pago inicial", "Gastos originación", "Impuestos y derechos", "Honorarios notariales", "Avalúo", "Comisión contratación", 
        # Totales
        "Pago total mensualidades", "Costo total", "Plazo (meses)", "nota_enganche"
    ]

    return out[cols]

# =====================================================
# FUNCIÓN MAESTRA PARA LA API (SCOTIABANK)
# =====================================================

def productos_para_usuario_scotiabank(usuario: dict, productos_disponibles_db: list) -> list:
    """
    Filtro de productos Scotiabank. 
    En esta etapa, el motor procesa ambos productos (Valora y Pagos Oportunos)
    basado en las políticas inyectadas por la base de datos.
    """
    return productos_disponibles_db

def orquestar_cotizacion_scotiabank(datos_usuario: dict, productos_banco: list) -> dict:
    """
    Función puente entre FastAPI y el motor de Scotiabank.
    """
    # 1. Filtramos (en este caso, pasan los disponibles de la DB)
    productos_viables = productos_para_usuario_scotiabank(datos_usuario, productos_banco)
    
    # 2. Generamos las cotizaciones
    todas_las_cotizaciones = []
    for prod in productos_viables:
        # Generamos las cotizaciones por producto y las acumulamos
        cotizaciones_producto = generar_cotizaciones_scotia(prod, datos_usuario, tol_mxn=50.0)
        if cotizaciones_producto:
            todas_las_cotizaciones.extend(cotizaciones_producto)
    
    # Manejo de caso sin resultados
    if not todas_las_cotizaciones:
        return {
            "exito": False,
            "mensaje": "No se encontraron cotizaciones viables para este perfil en Scotiabank.",
            "data_usuario": [],
            "data_broker": []
        }
        
    # 3. Ordenamos usando la función matemática original
    df_all = ordenar_cotizaciones(todas_las_cotizaciones)
    
    # 4. Formateamos las salidas
    df_usuario = salida_usuario_all(df_all)
    df_broker = salida_broker_all(df_all)
    
    # Retornamos el JSON para React
    return {
        "exito": True,
        "mensaje": "Cotizaciones Scotiabank generadas exitosamente.",
        "data_usuario": df_usuario.to_dict(orient="records"),
        "data_broker": df_broker.to_dict(orient="records")
    }