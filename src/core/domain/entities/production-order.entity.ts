import { ProductionStatus } from "@domain/enum/production-status.enum";

export interface ProductionItem {
  sku: string;
  quantity: number;
}

export class ProductionOrder {
  constructor(
    public readonly sessionId: string,
    public readonly items: ProductionItem[],
    public status: ProductionStatus,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public updatedAt?: Date
  ) {}

  static create(sessionId: string, items: ProductionItem[]): ProductionOrder {
    return new ProductionOrder(
      sessionId,
      items,
      ProductionStatus.RECEIVED,
      undefined,
      new Date(),
      new Date()
    );
  }

  startPreparation(): void {
    if (this.status !== ProductionStatus.RECEIVED) {
      throw new Error(
        "Só é possível iniciar preparação de pedidos com status RECEBIDO."
      );
    }
    this.status = ProductionStatus.IN_PREPARATION;
    this.updatedAt = new Date();
  }

  markAsReady(): void {
    if (this.status !== ProductionStatus.IN_PREPARATION) {
      throw new Error(
        "O pedido precisa estar EM PREPARAÇÃO para ficar PRONTO."
      );
    }
    this.status = ProductionStatus.READY;
    this.updatedAt = new Date();
  }

  markAsFinished(): void {
    if (this.status !== ProductionStatus.READY) {
      throw new Error("O pedido precisa estar PRONTO para ser FINALIZADO.");
    }
    this.status = ProductionStatus.COMPLETED;
    this.updatedAt = new Date();
  }
}
