export enum OrderStatus {
  RECEIVED = "RECEIVED", // Recebido (Aguardando Pagamento ou Processamento)
  IN_PREPARATION = "IN_PREPARATION", // Pagamento OK, Cozinha trabalhando
  READY = "READY", // Pronto para retirada
  COMPLETED = "COMPLETED", // Entregue
  CANCELLED = "CANCELLED", // Cancelado
}
