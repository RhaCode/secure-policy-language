Backend: Docker & local run
--------------------------

This file explains how to build and run the backend in Docker for local development.

Prerequisites
- Docker Desktop installed and running
- (Optional) `docker-compose` available (Docker Desktop includes it)

Quick steps

1) Create an empty SQLite file for persistence (in PowerShell):

```powershell
New-Item -Path .\backend\spl_database.db -ItemType File -Force
```

2) Build and run with docker-compose (recommended):

```powershell
# from repo root
docker-compose up --build -d
```

3) Or build & run the image directly:

```powershell
# build image
docker build -t spl-backend -f backend/Dockerfile .

# run container (example with placeholder env vars)
docker run --rm -p 5000:5000 \
  -e AZURE_OPENAI_KEY="placeholder" \
  -e AZURE_OPENAI_ENDPOINT="placeholder" \
  -v ${PWD}\backend\spl_database.db:/app/spl_database.db \
  spl-backend
```

4) Test the API (PowerShell):

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health -Method Get | ConvertTo-Json -Depth 4
```

Notes
- Do NOT commit real API keys; use environment variables and your host/CI secret store.
- If you change DB strategy (use Postgres, etc.), update `backend/database/db_manager.py` accordingly.