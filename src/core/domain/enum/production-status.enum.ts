export enum ProductionStatus {
  RECEIVED = "RECEIVED", // Chegou na cozinha
  IN_PREPARATION = "IN_PREPARATION", // Em preparo
  READY = "READY", // Pronto para retirada
  COMPLETED = "COMPLETED", // Cliente retirou (sai da tela)
  CANCELLED = "CANCELLED", // Cancelado
}
