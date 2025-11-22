# Backend/OCR/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# (add apt-get if you need extra libs – e.g. libgl1 for OpenCV)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend-requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY Backend/OCR/ /app/

EXPOSE 5000
CMD ["python", "app.py"]
