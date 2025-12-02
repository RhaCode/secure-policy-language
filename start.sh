#!/bin/bash

# Start backend
echo "Starting Flask API..."
python -m backend.app &

# Start nginx
echo "Starting Nginx..."
nginx -g "daemon off;"
