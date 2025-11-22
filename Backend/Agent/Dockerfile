# Backend/Agent/Dockerfile
FROM python:3.11-slim

# Avoid .pyc and ensure unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install OS deps if you need e.g. poppler, tesseract, etc.
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     poppler-utils \
#     && rm -rf /var/lib/apt/lists/*

# Copy shared Python deps file from repo root
COPY backend-requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the Agent service code
COPY Backend/Agent/ /app/

EXPOSE 5001
CMD ["python", "app.py"]
