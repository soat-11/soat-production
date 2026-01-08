import { ProductionOrderMapper } from "./production-order.mapper";
import { ProductionOrder } from "@domain/entities/production-order.entity";
import { ProductionStatus } from "@domain/enum/production-status.enum";
import { ProductionOrderModel } from "../schemas/production-order.schema";

describe("ProductionOrderMapper", () => {
  describe("toDomain", () => {
    it("deve converter ProductionOrderModel para ProductionOrder", () => {
      const date = new Date();
      const raw: ProductionOrderModel & {
        _id: any;
        createdAt: Date;
        updatedAt: Date;
      } = {
        sessionId: "session-123",
        items: [{ sku: "A", quantity: 1 }],
        status: "RECEIVED",
        _id: "507f1f77bcf86cd799439011",
        createdAt: date,
        updatedAt: date,
      };

      const result = ProductionOrderMapper.toDomain(raw);

      expect(result).toBeInstanceOf(ProductionOrder);
      expect(result.sessionId).toBe("session-123");
      expect(result.items).toHaveLength(1);
      expect(result.status).toBe(ProductionStatus.RECEIVED);
      expect(result.id).toBe("507f1f77bcf86cd799439011");
      expect(result.createdAt).toBe(date);
    });
  });

  describe("toPersistence", () => {
    it("deve converter ProductionOrder para objeto de persistência", () => {
      const domain = new ProductionOrder(
        "session-123",
        [{ sku: "B", quantity: 2 }],
        ProductionStatus.IN_PREPARATION,
        "some-id"
      );

      const result = ProductionOrderMapper.toPersistence(domain);

      expect(result).toEqual({
        sessionId: "session-123",
        status: "IN_PREPARATION",
        items: [{ sku: "B", quantity: 2 }],
      });
    });
  });
});
