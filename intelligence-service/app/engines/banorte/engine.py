from .helpers import fecha_es, money, pct, factor_anualidad, seguros_y_admin, cat_por_tir, avaluo_contra_cfg, notariales_contra_cfg, obtener_instituto
import numpy as np
import pandas as pd

class BanorteEngine:
    def __init__(self, payload: dict):
        """
        Interpreta el politicas_json enviado desde mortgage-core.
       
        """
        self.config = payload
        self.nombre_producto = payload.get("nombre")
        self.tasas = payload.get("tasas", [])
        self.pol = payload.get("politicas", {})
        
        # El 'tipo' es el pivote de toda la lógica posterior
        self.tipo_producto = self.pol.get("tipo", "tradicional")

    def _mensualidad_total(self, credito, tasa_anual, plazo, adders, subcuenta=0.0):
        """
        Mensualidad total = (cap+int) + adders. 
        Replica exacta de la Sección 3 del notebook.
        """
        apertura_pct = float(self.pol["comision_apertura_pct"])
        apertura_fin = bool(self.pol.get("comision_apertura_financiada", True))
        
        # 1. Cálculo del principal (considerando apertura financiada)
        com_ap = credito * apertura_pct
        principal = credito + (com_ap if apertura_fin else 0.0)

        # 2. Abatimiento de subcuenta SOLO en producto 'apoyo'
        if self.tipo_producto == "apoyo":
            aplicar = min(subcuenta, principal)
            principal = max(0.0, principal - aplicar)

        # 3. Capital + Interés
        tasa_m = float(tasa_anual) / 12.0
        f = factor_anualidad(tasa_m, plazo)
        cap_int = principal * f
        
        # 4. Suma de adders (seguros/admin) y redondeo a peso
        m_total = cap_int + adders
        return float(np.floor(m_total + 0.5))

    def _credito_tope_estructura(self, valor, enganche, credito_inst, subcuenta):
        """
        Tope de crédito Banorte por estructura y políticas.
        Replica exacta de la Sección 3 del notebook.
        """
        aforo_max_banorte = float(self.pol.get("aforo_max", 0.95))
        tope_total = self.pol.get("apoyos", {}).get("aforo_total_max_instituto", None)
        
        # Determinar si el instituto participa con crédito
        instituto_tiene_credito = bool(self.pol.get("apoyos", {}).get("instituto_tiene_credito", False)) or (credito_inst > 0)

        # 1. Definición de la estructura según el tipo de producto
        if self.tipo_producto == "cofinavit":
            estruct = max(0.0, valor - (enganche + credito_inst + subcuenta))
        elif self.tipo_producto in ("fpt", "cta_infonavit"):
            estruct = max(0.0, valor - (enganche + credito_inst))
        else:  # tradicional / apoyo
            estruct = max(0.0, valor - enganche)

        # 2. Límite por aforo del banco
        credito_top = min(estruct, valor * aforo_max_banorte)

        # 3. Límite por aforo total (Instituto + Banorte)
        if tope_total is not None and instituto_tiene_credito:
            credito_top = min(credito_top, max(0.0, valor * float(tope_total) - credito_inst))

        return round(max(0.0, credito_top), 2)

    def rescate_por_enganche(
        self, 
        valor, 
        enganche_inicial, 
        ingreso_usuario, 
        plazo, 
        credito_inst, 
        tasas_df,
        subcuenta, 
        adders,
        enganche_min_pct, 
        enganche_max_pct=0.30, 
        delta_enganche_pct=0.02,
        tol_mxn=50.0
    ):
        """
        Aumenta el enganche en pasos delta hasta cumplir la capacidad de pago.
        Fidelidad 100% a la Sección 4 del notebook.
        """
        if valor <= 0: return None

        relacion_ir = float(self.pol["relacion_ir"])
        mensualidad_tope = float(ingreso_usuario) / relacion_ir

        pct_usuario = enganche_inicial / valor
        pct_actual = max(pct_usuario, enganche_min_pct)
        pct_actual = min(pct_actual, enganche_max_pct)

        # Usamos el tasas_df que entra por argumento (el calco de la Sección 5)
        mejores = []
        for _, r in tasas_df.iterrows():
            tasa_nombre = r["nombre_tasa"]
            # El notebook asume que ya viene dividido o lo divide aquí
            # Si en df_tmp pusimos 9.38, aquí dividimos entre 100.
            tasa_anual = float(r["tasa_anual_pct"]) / 100.0 if r["tasa_anual_pct"] > 1 else r["tasa_anual_pct"]

            pct = pct_actual
            cumple = None
            while pct <= enganche_max_pct + 1e-9:
                enganche = round(valor * pct, 2)
                credito_top = self._credito_tope_estructura(valor, enganche, credito_inst, subcuenta)
                
                if credito_top <= 0:
                    pct += delta_enganche_pct
                    continue

                m = self._mensualidad_total(credito_top, tasa_anual, plazo, adders, subcuenta=subcuenta)
                
                if m <= mensualidad_tope + tol_mxn:
                    cumple = (pct, enganche, credito_top, m)
                    break
                pct += delta_enganche_pct

            if cumple is not None:
                pct_ok, eng_ok, cred_ok, m_ok = cumple
                mejores.append({
                    "tasa_nombre": tasa_nombre,
                    "tasa_anual_pct": r["tasa_anual_pct"],
                    "pct_enganche_nuevo": pct_ok,
                    "enganche_nuevo": eng_ok,
                    "credito_max": cred_ok,
                    "mens_compatible": m_ok
                })

        if not mejores: return None

        # 4. Ranking de mejores opciones
        # Criterios: Mensualidad (asc), Tasa (asc), Crédito (desc)
        df = pd.DataFrame(mejores).sort_values(
            by=["mens_compatible", "tasa_anual_pct", "credito_max"],
            ascending=[True, True, False]
        ).reset_index(drop=True)

        return df.iloc[0], df
    
    def _cotizar_por_tasa(self, usuario, nombre_tasa, tasa_anual_fija, tol_mxn=50.0):
        """
        Inicia la cotización de UNA tasa.
        Réplica exacta del primer bloque de la Sección 5.
        """
        valor = float(usuario["valor_vivienda"])
        ingreso = float(usuario["ingreso_bruto"])
        plazo = int(usuario["plazo_meses"])

        # -------------------------
        # Enganche (mínimo producto)
        # -------------------------
        con_instituto = bool(self.pol.get("apoyos", {}).get("tiene_apoyos", False))
        min_pct_enganche = 0.05 if con_instituto else 0.10
        user_pct_e = float(usuario.get("pct_enganche", min_pct_enganche))

        # Respetar mínimo del producto
        pct_e_usado = max(user_pct_e, min_pct_enganche)
        enganche = round(valor * pct_e_usado, 2)

        # Lógica de notas de enganche (Calco del notebook)
        if user_pct_e < min_pct_enganche:
            motivo_enganche = (
                f"Enganche ingresado ({user_pct_e*100:.1f}%) "
                f"ajustado al mínimo del producto ({min_pct_enganche*100:.0f}%)."
            )
        elif user_pct_e > min_pct_enganche:
            motivo_enganche = (
                f"Se respetó el enganche ingresado por el usuario ({user_pct_e*100:.1f}%), "
                f"mayor al mínimo requerido ({min_pct_enganche*100:.0f}%)."
            )
        else:
            motivo_enganche = f"Enganche igual al mínimo del producto ({min_pct_enganche*100:.0f}%)."

        # -------------------------
        # Instituto (según tipo)
        # -------------------------
        if self.tipo_producto == "tradicional":
            nombre_inst, credito_inst, subcuenta = ("", 0.0, 0.0)
        else:
            # Llama al helper de la Sección 1
            nombre_inst, credito_inst, subcuenta = obtener_instituto(usuario, self.tipo_producto)

        instituto_tiene_credito = (
            bool(self.pol.get("apoyos", {}).get("instituto_tiene_credito", False)) or (credito_inst > 0)
        )

        # -------------------------
        # Crédito preliminar usando _credito_tope_estructura
        # -------------------------
        # Usamos el método interno de la clase que calca la Sección 3
        credito_pre = self._credito_tope_estructura(
            valor=valor,
            enganche=enganche,
            credito_inst=credito_inst,
            subcuenta=subcuenta
        )
        credito_pre = max(0.0, round(credito_pre, 2))

        # -------------------------
        # Costos / seguros (Importados de .helpers)
        # -------------------------
        # Estos métodos extraen montos del politicas_json
        avaluo = avaluo_contra_cfg(valor, self.pol)
        gastos_not = notariales_contra_cfg(valor, self.pol)
        com_ap_pre = round(credito_pre * float(self.pol["comision_apertura_pct"]), 2)
        gastos_aprob = round(float(self.pol["gastos_aprobacion"]), 2)
        
        # Obtenemos seguros detallados (Sección 1)
        sa, seg_vida, seg_danos, com_admin = seguros_y_admin(valor, self.pol)

        # -------------------------
        # Subcuenta (según tipo)
        # -------------------------
        sub_aplica_capital = 0.0
        descuento_sub_desembolso = 0.0
        
        if self.tipo_producto == "apoyo":
            # Se suma la comisión solo si es financiada, tal como en el notebook
            principal_pago_tmp = credito_pre + (com_ap_pre if self.pol.get("comision_apertura_financiada", True) else 0.0)
            sub_aplica_capital = min(subcuenta, principal_pago_tmp)
            
        elif self.tipo_producto in ("cta_infonavit", "fpt"):
            descuento_sub_desembolso = min(subcuenta, enganche)

        # -------------------------
        # Gastos de cierre y desembolso inicial
        # -------------------------
        desembolso_base = round(enganche + avaluo + gastos_not + gastos_aprob, 2)
        gastos_inst = 0.0
        
        # Gastos adicionales por el uso de crédito de instituto (3% típicamente)
        if self.tipo_producto == "cofinavit":
            gastos_inst = round(credito_inst * float(self.pol.get("gastos_infonavit_pct", 0.0)), 2)
            desembolso_base = round(desembolso_base + gastos_inst, 2)
            
        if self.tipo_producto == "fpt":
            gastos_inst = round(credito_inst * float(self.pol.get("gastos_fovissste_pct", 0.0)), 2)
            desembolso_base = round(desembolso_base + gastos_inst, 2)
            
        # Desembolso neto final tras aplicar la subcuenta
        desembolso_base = round(max(0.0, desembolso_base - descuento_sub_desembolso), 2)

        # -------------------------
        # Tabla de esta tasa (Normal)
        # -------------------------
        tasa_a = float(tasa_anual_fija)
        tasa_m = tasa_a / 12.0
        f = factor_anualidad(tasa_m, plazo)
        
        # Se determina la base del principal para el pago de capital e interés
        principal_pago_base = credito_pre + (com_ap_pre if self.pol.get("comision_apertura_financiada", True) else 0.0)
        
        if self.tipo_producto == "apoyo":
            # Único caso donde la subcuenta reduce directamente la base del pago mensual
            principal_pago_base = max(0.0, principal_pago_base - sub_aplica_capital)

        # Capital e Interés redondeado a dos decimales
        cap_int = round(principal_pago_base * f, 2)
        
        # Mensualidad final (C+I + Seguros + Admin)
        mensualidad = round(cap_int + seg_vida + seg_danos + com_admin, 2)
        ingreso_req = round(mensualidad * float(self.pol["relacion_ir"]), 2)
        
        # Cálculo de CAT vía TIR usando el helper de la Sección 1
        cat = cat_por_tir(
            credito_banorte=credito_pre,
            avaluo=avaluo,
            gastos_aprob=gastos_aprob,
            com_apertura=com_ap_pre,
            politicas=self.pol,
            mensualidad=mensualidad,
            plazo=plazo
        )
        # El CAT se presenta con un decimal en el notebook
        cat_pct = (round(cat * 100, 1) if pd.notna(cat) else np.nan)

        # -------------------------
        # ¿Cumple "Normal"?
        # -------------------------
        relacion_ir = float(self.pol["relacion_ir"])
        tope_mens = float(ingreso) / relacion_ir
        
        # Validación de capacidad de pago con margen de tolerancia
        if mensualidad <= tope_mens + tol_mxn:
            pago_total_mens = round(mensualidad * plazo, 2)
            costo_total = round(desembolso_base + pago_total_mens, 2)
            
            # Cálculo final de Aforos para el reporte
            aforo_b = (credito_pre / valor) if valor > 0 else 0.0
            aforo_i = (credito_inst / valor) if (valor > 0 and instituto_tiene_credito) else 0.0
            
            return {
                "modo": "Normal",
                "producto": self.config["nombre"],
                "tasa_nombre": nombre_tasa,
                "tasa_anual_pct": round(tasa_a * 100, 2),
                "cat_pct": cat_pct,
                "mensualidad": mensualidad,
                "ingreso_req": ingreso_req,
                "credito_banorte": round(credito_pre, 2),
                "enganche": enganche,
                "pct_enganche": pct_e_usado,
                "desembolso_inicial": desembolso_base,
                "pago_total_mensualidades": pago_total_mens,
                "costo_total_cliente": costo_total,
                "plazo": plazo,
                "valor_vivienda": valor,
                "aforo_banorte_pct": round(aforo_b * 100, 2),
                "aforo_instituto_pct": round(aforo_i * 100, 2),
                "aforo_total_pct": round((aforo_b + aforo_i) * 100, 2),
                "nota_enganche": motivo_enganche,
            }

        # ====================================================
        # Si no cumple Normal → RESCATE POR ENGANCHE
        # ====================================================
        # Se construye un DataFrame temporal para alimentar el optimizador de la Sección 4
        df_tmp = pd.DataFrame([{
            "nombre_tasa": nombre_tasa,
            "tasa_anual_pct": round(tasa_a * 100, 2),
            "mensualidad": mensualidad,
            "ingreso_req": ingreso_req,
            "cat": cat_pct
        }])

        # Se invoca el método de rescate definido anteriormente
        out = self.rescate_por_enganche(
            valor=valor,
            enganche_inicial=enganche,
            ingreso_usuario=ingreso,
            plazo=plazo,
            credito_inst=credito_inst,
            subcuenta=subcuenta,
            tasas_df=df_tmp,
            adders=(seg_vida + seg_danos + com_admin),
            enganche_min_pct=min_pct_enganche,
            enganche_max_pct=0.30,
            delta_enganche_pct=0.02,
            tol_mxn=tol_mxn
        )

        if out is None:
            return None

        # Selección de los parámetros optimizados tras el rescate
        sel, _rank = out
        enganche_final = float(sel["enganche_nuevo"])
        pct_enganche_final = float(sel["pct_enganche_nuevo"])
        credito_final = float(sel["credito_max"])
        tasa_m2 = (float(sel["tasa_anual_pct"]) / 100.0) / 12.0

        # -------------------------
        # Recalcular todo con nuevo enganche/crédito (Rescate)
        # -------------------------
        com_ap_final = round(credito_final * float(self.pol["comision_apertura_pct"]), 2)
        
        # Determinación de la base de amortización considerando comisión financiada
        apertura_fin = bool(self.pol.get("comision_apertura_financiada", True))
        principal_resc = credito_final + (com_ap_final if apertura_fin else 0.0)
        
        if self.tipo_producto == "apoyo":
            # En producto Apoyo, se aplica la subcuenta para reducir el capital del pago mensual
            aplicar = min(subcuenta, principal_resc)
            principal_resc = max(0.0, principal_resc - aplicar)

        # Cálculo de la nueva mensualidad e ingreso requerido compatibles tras el rescate
        f2 = factor_anualidad(tasa_m2, plazo)
        cap_int2 = principal_resc * f2
        mensualidad2 = round(cap_int2 + seg_vida + seg_danos + com_admin, 2)
        ingreso_req2 = round(mensualidad2 * float(self.pol["relacion_ir"]), 2)

        # -------------------------
        # Desembolso nuevo (Post-Rescate)
        # -------------------------
        descuento_sub_desembolso2 = 0.0
        if self.tipo_producto in ("cta_infonavit", "fpt"):
            # La subcuenta reduce el efectivo necesario para el nuevo enganche
            descuento_sub_desembolso2 = min(subcuenta, enganche_final)

        desembolso2 = round(enganche_final + avaluo + gastos_not + gastos_aprob, 2)
        
        # Ajuste por comisiones de institutos sobre el crédito del instituto
        if self.tipo_producto == "cofinavit":
            gastos_i = round(credito_inst * float(self.pol.get("gastos_infonavit_pct", 0.0)), 2)
            desembolso2 = round(desembolso2 + gastos_i, 2)
        if self.tipo_producto == "fpt":
            gastos_f = round(credito_inst * float(self.pol.get("gastos_fovissste_pct", 0.0)), 2)
            desembolso2 = round(desembolso2 + gastos_f, 2)
            
        desembolso2 = round(max(0.0, desembolso2 - descuento_sub_desembolso2), 2)

        # -------------------------
        # Costos y Aforos finales del Rescate
        # -------------------------
        pago_total_mens2 = round(mensualidad2 * plazo, 2)
        costo_total2 = round(desembolso2 + pago_total_mens2, 2)
        
        aforo_b2 = (credito_final / valor) if valor > 0 else 0.0
        aforo_i2 = (credito_inst / valor) if (valor > 0 and instituto_tiene_credito) else 0.0

        # -------------------------
        # Recalcular CAT para el escenario rescatado
        # -------------------------
        cat_resc = cat_por_tir(
            credito_banorte=credito_final,
            avaluo=avaluo,
            gastos_aprob=gastos_aprob,
            com_apertura=com_ap_final,
            politicas=self.pol,
            mensualidad=mensualidad2,
            plazo=plazo
        )
        cat_resc_pct = (round(cat_resc * 100, 1) if pd.notna(cat_resc) else np.nan)

        # -------------------------
        # Nota de enganche coherente (Calco del notebook)
        # -------------------------
        if pct_enganche_final > pct_e_usado + 1e-9:
            nota_rescate = (
                f"Enganche aumentado de {pct_e_usado*100:.1f}% a "
                f"{pct_enganche_final*100:.1f}% para cumplir capacidad de pago."
            )
        elif abs(pct_enganche_final - pct_e_usado) <= 1e-9:
            nota_rescate = "Crédito ajustado para cumplir capacidad de pago (enganche sin cambio)."
        else:
            nota_rescate = "Parámetros ajustados para cumplir capacidad de pago."

        # -------------------------
        # Retorno de la Cotización Rescatada
        # -------------------------
        return {
            "modo": "Rescate",
            "producto": self.config["nombre"],
            "tasa_nombre": sel["tasa_nombre"],
            "tasa_anual_pct": float(sel["tasa_anual_pct"]),
            "cat_pct": cat_resc_pct,
            "mensualidad": mensualidad2,
            "ingreso_req": ingreso_req2,
            "credito_banorte": round(credito_final, 2),
            "enganche": enganche_final,
            "pct_enganche": pct_enganche_final,
            "desembolso_inicial": desembolso2,
            "pago_total_mensualidades": pago_total_mens2,
            "costo_total_cliente": costo_total2,
            "plazo": plazo,
            "valor_vivienda": valor,
            "aforo_banorte_pct": round(aforo_b2 * 100, 2),
            "aforo_instituto_pct": round(aforo_i2 * 100, 2),
            "aforo_total_pct": round((aforo_b2 + aforo_i2) * 100, 2),
            "nota_enganche": nota_rescate,
        }

    def generar_cotizaciones(self, usuario, tol_mxn=50.0):
        """
        Recorre cada tasa disponible del producto actual y construye una cotización por cada una.
        Réplica fiel de la lógica de recolección de la Sección 5.
        """
        todas = []
        
        # Iteramos sobre las tasas que vienen en el politicas_json
        for tasa in self.tasas:
            nombre_tasa = tasa["nombre"]
            tasa_fija = tasa["tasa_anual_fija"]
            
            # Ejecutamos la cotización individual (ya incluye lógica Normal y Rescate)
            cot = self._cotizar_por_tasa(
                usuario=usuario, 
                nombre_tasa=nombre_tasa, 
                tasa_anual_fija=tasa_fija, 
                tol_mxn=tol_mxn
            )
            
            # Solo agregamos a la lista si la cotización fue viable
            if cot is not None:
                todas.append(cot)
                
        return todas