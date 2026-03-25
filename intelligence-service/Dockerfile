FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias para XGBoost
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos la aplicación y los modelos
COPY ./app ./app
COPY ./models ./models

# Exponemos el puerto de FastAPI
EXPOSE 8002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]