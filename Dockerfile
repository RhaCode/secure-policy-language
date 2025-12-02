
#  Build FRONTEND

FROM node:18 AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build



#  Build BACKEND

FROM python:3.10-slim AS backend

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y \
    build-essential \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY backend ./backend
COPY requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt


#  Copy Frontend into Nginx

COPY --from=frontend-builder /app/frontend/dist /var/www/html

# Replace Nginx default site
RUN rm /etc/nginx/sites-enabled/default

RUN bash -c 'cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen 80;
    root /var/www/html;
    index index.html index.htm;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
    }

    location / {
        try_files \$uri /index.html;
    }
}
EOF'


#  Start Backend + Nginx

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80
EXPOSE 5000

CMD ["/start.sh"]
