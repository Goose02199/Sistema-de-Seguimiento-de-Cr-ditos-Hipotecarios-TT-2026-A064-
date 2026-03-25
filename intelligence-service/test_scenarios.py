from app.core.predictor import RiskPredictor

predictor = RiskPredictor()

# Escenario A: Cliente con ingresos altos, deuda baja y casa propia
cliente_bueno = {
    "loan_amnt_MXN2025": 100000,
    "annual_inc_MXN2025": 1500000,
    "dti": 10.0,
    "verification_status": "verified",
    "home_ownership": "OWN",
    "earliest_cr_line": 2010
}

# Escenario B: Cliente con ingresos bajos, muchas consultas y mucha deuda
cliente_riesgoso = {
    "loan_amnt_MXN2025": 800000,
    "annual_inc_MXN2025": 200000,
    "dti": 45.0,
    "inq_last_6mths": 5,
    "delinq_2yrs": 2,
    "home_ownership": "RENT",
    "earliest_cr_line": 2023
}

print("--- RESULTADO CLIENTE BUENO ---")
print(predictor.process_and_predict(cliente_bueno))

print("\n--- RESULTADO CLIENTE RIESGOSO ---")
print(predictor.process_and_predict(cliente_riesgoso))