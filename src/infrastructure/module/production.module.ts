import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MessagingModule } from "../messaging/messaging.module";
import {
  ProductionOrderModel,
  ProductionOrderSchema,
} from "../database/mongoose/schemas/production-order.schema";

// Controllers e UseCases vamos adicionar em breve, deixei comentado
// import { ProductionController } from "../../interface/controllers/production.controller";
// import { ProductionRepository } from "../database/mongoose/repositories/production.repository";

@Module({
  imports: [
    MessagingModule,
    MongooseModule.forFeature([
      { name: ProductionOrderModel.name, schema: ProductionOrderSchema },
    ]),
  ],
  controllers: [],
  providers: [
    // Aqui virão os UseCases e o Repository Implementation
    // { provide: 'IProductionRepository', useClass: ProductionRepository }
  ],
  exports: [],
})
export class ProductionModule {}
