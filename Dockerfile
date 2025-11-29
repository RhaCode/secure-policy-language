# =============================
# 1) FRONTEND BUILD (VITE)
# =============================
FROM node:18 AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build


# =============================
# 2) BACKEND BUILD (PYTHON)
# =============================
FROM python:3.11-slim AS backend

WORKDIR /app

# Ensure backend module can be imported
ENV PYTHONPATH="/app/backend"

RUN apt-get update && apt-get install -y \
    build-essential \
    && apt-get clean

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./backend/static

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r backend/requirements.txt

EXPOSE 8000

CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:8000"]
