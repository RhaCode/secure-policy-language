FROM python:3.11-slim

WORKDIR /app
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app", "--workers", "1"]

# Install dependencies
COPY . /requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app

ENV PYTHONUNBUFFERED=1

# Azure uses dynamic PORT, default fallback is 8000
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8000} backend.app:app --workers 1"]
