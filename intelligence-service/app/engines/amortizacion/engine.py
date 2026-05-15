import os
import io
import pandas as pd
import numpy as np
from datetime import datetime

# Rutas dinámicas para los assets
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT

# =========================================================
# FUNCIONES DE LIMPIEZA
# =========================================================
def limpiar_moneda(valor):
    if pd.isna(valor): return np.nan
    if isinstance(valor, (int, float)): return float(valor)
    return float(str(valor).replace("$", "").replace(",", "").strip())

def limpiar_porcentaje(valor):
    if pd.isna(valor): return np.nan
    if isinstance(valor, (int, float)): return float(valor)
    return float(str(valor).replace("%", "").strip())

def formatear_moneda(valor):
    return f"${float(valor):,.2f}"

# =========================================================
# GENERADOR DE TABLA (JSON/DATAFRAME)
# =========================================================
def generar_tabla_amortizacion(monto_credito, tasa_anual, plazo_meses, mensualidad):
    monto_credito = limpiar_moneda(monto_credito)
    tasa_anual = limpiar_porcentaje(tasa_anual)
    mensualidad = limpiar_moneda(mensualidad)
    plazo_meses = int(plazo_meses)
    tasa_mensual = (tasa_anual / 100) / 12

    if tasa_mensual > 0:
        f = (tasa_mensual * (1 + tasa_mensual)**plazo_meses) / ((1 + tasa_mensual)**plazo_meses - 1)
    else:
        f = 1 / plazo_meses

    pago_puro = monto_credito * f          
    adders = mensualidad - pago_puro    

    saldo = monto_credito
    registros = []

    for mes in range(1, plazo_meses + 1):
        saldo_inicial = saldo
        interes = round(saldo_inicial * tasa_mensual, 2)
        abono_capital = round(pago_puro - interes, 2)

        if abono_capital >= saldo:
            abono_capital = saldo
            pago_real = round(interes + abono_capital + adders, 2)
        else:
            pago_real = mensualidad

        saldo = round(max(saldo_inicial - abono_capital, 0), 2)

        registros.append({
            "Mes": mes,
            "Saldo inicial": round(saldo_inicial, 2),
            "Mensualidad": pago_real,
            "Interés": interes,
            "Abono a capital": abono_capital,
            "Saldo final": saldo
        })

        if saldo <= 0: break

    return pd.DataFrame(registros)

def generar_resumen_amortizacion(df_amortizacion, pago_inicial=0):
    pago_inicial = limpiar_moneda(pago_inicial)
    total_mensualidades = float(df_amortizacion["Mensualidad"].sum())
    return {
        "Pago inicial": round(pago_inicial, 2),
        "Total mensualidades": round(total_mensualidades, 2),
        "Total intereses": float(round(df_amortizacion["Interés"].sum(), 2)),
        "Total capital": float(round(df_amortizacion["Abono a capital"].sum(), 2)),
        "Costo total": round(total_mensualidades + pago_inicial, 2)
    }

# =========================================================
# GENERADOR DE EXCEL EN RAM
# =========================================================
def generar_excel_amortizacion(df_amortizacion, resumen):
    buffer = io.BytesIO()
    # Usamos openpyxl para crear el archivo en memoria
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df_amortizacion.to_excel(writer, sheet_name="Amortizacion", index=False)
        pd.DataFrame([resumen]).to_excel(writer, sheet_name="Resumen", index=False)
    
    buffer.seek(0)
    return buffer

# =========================================================
# GENERADOR DE PDF EN RAM (CON LOGOS Y ESTILOS)
# =========================================================
def tabla_resumen_pdf(diccionario, ancho_col1=110, ancho_col2=150):
    data = [[str(k), str(v)] for k, v in diccionario.items()]
    tabla = Table(data, colWidths=[ancho_col1, ancho_col2])
    tabla.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F4F6F8")),
    ]))
    return tabla

def dibujar_elementos_pagina(canvas_obj, doc, logo_path=None):
    """ Función que pinta los logos y el pie de página en cada hoja """
    canvas_obj.saveState()
    ancho, alto = landscape(letter)

    if logo_path and os.path.exists(logo_path):
        try:
            canvas_obj.saveState()
            # Marca de agua central (inclinada y transparente)
            if hasattr(canvas_obj, "setFillAlpha"):
                canvas_obj.setFillAlpha(0.07)
            canvas_obj.translate(ancho / 2, alto / 2 - 10)
            canvas_obj.rotate(25)
            canvas_obj.drawImage(logo_path, -140, -140, width=280, height=280, preserveAspectRatio=True, mask='auto')
            canvas_obj.restoreState()
            
            # Logo pequeño en la esquina superior derecha
            canvas_obj.drawImage(logo_path, ancho - 110, alto - 48, width=70, height=24, preserveAspectRatio=True, mask='auto')
        except Exception as e:
            print(f"Error al dibujar logo: {e}")

    # Línea superior e inferior
    canvas_obj.setStrokeColor(colors.HexColor("#D9D9D9"))
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(doc.leftMargin, alto - 55, ancho - doc.rightMargin, alto - 55)

    pie_texto = "Documento informativo e ilustrativo. Sujeto a validación bancaria."
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.grey)
    canvas_obj.drawCentredString(ancho / 2, 18, pie_texto)
    canvas_obj.drawRightString(ancho - doc.rightMargin, 18, f"Página {canvas_obj.getPageNumber()}")
    canvas_obj.line(doc.leftMargin, 28, ancho - doc.rightMargin, 28)
    
    canvas_obj.restoreState()

def generar_pdf_amortizacion(datos_usuario, datos_credito, resumen, df_amortizacion):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=landscape(letter), 
        rightMargin=18, leftMargin=18, topMargin=60, bottomMargin=38
    )
    
    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle(name="Titulo", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=15, alignment=TA_LEFT, spaceAfter=2)
    sub_style = ParagraphStyle(name="Sub", parent=styles["Heading3"], fontName="Helvetica-Bold", fontSize=9, textColor=colors.HexColor("#1F1F1F"), spaceAfter=2)
    
    elementos = []
    elementos.append(Paragraph("Tabla de Amortización Hipotecaria", titulo_style))
    elementos.append(Spacer(1, 2))
    
    fecha = {"Fecha de generación": datetime.now().strftime("%d/%m/%Y %H:%M")}
    elementos.append(tabla_resumen_pdf(fecha, ancho_col1=120, ancho_col2=110))
    elementos.append(Spacer(1, 5))

    # Preparar tablas superiores (Usuario, Crédito, Resumen)
    datos_cliente_t = tabla_resumen_pdf(datos_usuario, ancho_col1=95, ancho_col2=170)
    datos_credito_t = tabla_resumen_pdf(datos_credito, ancho_col1=100, ancho_col2=160)
    resumen_t = tabla_resumen_pdf({k: formatear_moneda(v) for k, v in resumen.items()}, ancho_col1=115, ancho_col2=120)

    tabla_superior = Table([
        [Paragraph("Datos del cliente", sub_style), Paragraph("Datos del crédito", sub_style), Paragraph("Resumen financiero", sub_style)],
        [datos_cliente_t, datos_credito_t, resumen_t]
    ], colWidths=[225, 250, 195])

    tabla_superior.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    
    elementos.append(tabla_superior)
    elementos.append(Spacer(1, 10))
    
    # Preparar el dataframe para el PDF
    df_pdf = df_amortizacion.copy()
    for col in ["Saldo inicial", "Mensualidad", "Interés", "Abono a capital", "Saldo final"]:
        df_pdf[col] = df_pdf[col].apply(formatear_moneda)
        
    data = [list(df_pdf.columns)] + df_pdf.values.tolist()
    tabla_datos = Table(data, repeatRows=1, colWidths=[40, 95, 85, 80, 95, 95])
    tabla_datos.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4E79")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#F7F7F7")]),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    
    elementos.append(tabla_datos)
    
    # Hook para dibujar el diseño de la página (logos y pie) en cada hoja
    def _on_page(canvas_obj, doc_obj):
        dibujar_elementos_pagina(canvas_obj, doc_obj, logo_path=LOGO_PATH)

    doc.build(elementos, onFirstPage=_on_page, onLaterPages=_on_page)
    
    buffer.seek(0)
    return buffer