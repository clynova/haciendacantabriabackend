#!/bin/bash

echo "Iniciando prueba de rate limit..."
for i in {1..100}
do
    echo "Petición #$i"
    curl -i -w "\n" http://localhost:4000/api/product
    echo "----------------------------------------"
    sleep 0.5
done
