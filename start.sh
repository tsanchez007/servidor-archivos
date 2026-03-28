#!/bin/bash
echo "☁ Iniciando Mi Nube..."
cd "$(dirname "$0")"
while true; do
  node server.js
  echo "⚠ Servidor caído, reiniciando en 1 segundo..."
  sleep 1
done
