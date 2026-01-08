#!/bin/bash
echo "Iniciando criação de filas SQS..."

# Fila que vamos ESCUTAR (vem do Payment)
awslocal sqs create-queue --queue-name payment-confirmed

# Filas que vamos PUBLICAR (eventos de cozinha)
awslocal sqs create-queue --queue-name production-started
awslocal sqs create-queue --queue-name production-ready
awslocal sqs create-queue --queue-name production-withdrawn

echo "Filas criadas com sucesso!"