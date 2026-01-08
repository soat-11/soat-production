import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MessagingModule } from "../messaging/messaging.module";
import {
  ProductionOrderModel,
  ProductionOrderSchema,
} from "../database/mongoose/schemas/production-order.schema";
import { ProductionRepository } from "../database/mongoose/repositories/production.repository";
import { ProductionEventsConsumer } from "../messaging/consumers/production-events.consumer";
import { ReceiveApprovedOrderUseCase } from "@core/use-cases/receive-approved-order.use-case";
import { ListProductionOrdersUseCase } from "@core/use-cases/list-production-orders.use-case";
import { UpdateProductionStatusUseCase } from "@core/use-cases/update-production-status.use-case";
import { ProductionController } from "@infra/http/controllers/production.controller";
import { CartGateway } from "@infra/gayteways/cart.gateway";

@Module({
  imports: [
    MessagingModule,
    MongooseModule.forFeature([
      { name: ProductionOrderModel.name, schema: ProductionOrderSchema },
    ]),
  ],
  controllers: [ProductionController],
  providers: [
    ProductionEventsConsumer,
    { provide: "IProductionRepository", useClass: ProductionRepository },
    ReceiveApprovedOrderUseCase,
    ListProductionOrdersUseCase,
    UpdateProductionStatusUseCase,
  ],
  exports: [],
})
export class ProductionModule {}
