#!/bin/bash
while true; do
  node ~/Documents/GitHub/servidor-archivos/server.js
  echo "Servidor caído, reiniciando en 1 segundo..."
  sleep 1
done
