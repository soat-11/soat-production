import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { Consumer } from "sqs-consumer";
import { SQSClient } from "@aws-sdk/client-sqs";
import { OrderStatus } from "@core/domain/enum/order-status.enum";

@Injectable()
export class ProductionEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private consumers: Consumer[] = [];
  private readonly logger = new Logger(ProductionEventsConsumer.name);

  constructor() {}
  onModuleDestroy() {
    throw new Error("Method not implemented.");
  }

  onModuleInit() {
    this.logger.log("Iniciando consumidores SQS...");

    //   // 1. Ouvinte: production.started -> Muda para IN_PREPARATION
    //   const startedConsumer = this.createConsumer(
    //     process.env.SQS_PRODUCTION_STARTED_URL!,
    //     OrderStatus.IN_PREPARATION
    //   );

    //   // 2. Ouvinte: production.ready -> Muda para READY
    //   const readyConsumer = this.createConsumer(
    //     process.env.SQS_PRODUCTION_READY_URL!,
    //     OrderStatus.READY
    //   );

    //   this.consumers.push(startedConsumer, readyConsumer);
    //   this.consumers.forEach((c) => c.start());
    // }

    // onModuleDestroy() {
    //   this.logger.log("Parando consumidores SQS...");
    //   this.consumers.forEach((c) => c.stop());
    // }

    // private createConsumer(
    //   queueUrl: string,
    //   targetStatus: OrderStatus
    // ): Consumer {
    //   return Consumer.create({
    //     queueUrl,
    //     sqs: new SQSClient({
    //       region: process.env.AWS_REGION || "us-east-1",
    //       endpoint: process.env.SQS_ENDPOINT || "http://localhost:4566",
    //       credentials: { accessKeyId: "test", secretAccessKey: "test" },
    //     }),
    //     handleMessage: async (message) => {
    //       try {
    //         const body = JSON.parse(message.Body!);
    //         const orderId = body.orderId;

    //         this.logger.log(
    //           `Mensagem recebida da fila [${targetStatus}]. OrderID: ${orderId}`
    //         );

    //         const result = await this.updateOrderStatusUseCase.execute(
    //           orderId,
    //           targetStatus
    //         );

    //         if (result.isFailure) {
    //           this.logger.error(
    //             `Erro ao atualizar pedido ${orderId}: ${result.error}`
    //           );
    //         } else {
    //           this.logger.log(
    //             `Pedido ${orderId} atualizado para ${targetStatus} com sucesso.`
    //           );
    //         }
    //       } catch (error) {
    //         this.logger.error("Erro ao processar mensagem SQS:", error);
    //         throw error;
    //       }
    //     },
    //   });
  }
}
