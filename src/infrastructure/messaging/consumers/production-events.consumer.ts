import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { Consumer } from "sqs-consumer";
import { SQSClient } from "@aws-sdk/client-sqs";
import { ConfigService } from "@nestjs/config";
import { ReceiveApprovedOrderUseCase } from "@core/use-cases/receive-approved-order.use-case";
import { CartGateway } from "@infra/gayteways/cart.gateway";

interface PaymentConfirmedMessage {
  sessionId: string;
  idempotencyKey: string;
}

@Injectable()
export class ProductionEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  private readonly logger = new Logger(ProductionEventsConsumer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly receiveApprovedOrderUseCase: ReceiveApprovedOrderUseCase,
    private readonly cartGateway: CartGateway
  ) {}

  onModuleInit() {
    const queueUrl = this.configService.get<string>(
      "SQS_PAYMENT_CONFIRMED_URL"
    );

    this.logger.log(`Iniciando consumidor de pagamentos na fila: ${queueUrl}`);

    this.consumer = Consumer.create({
      queueUrl,
      sqs: new SQSClient({
        region: this.configService.get<string>("AWS_REGION"),
        endpoint: this.configService.get<string>("SQS_ENDPOINT"),
        credentials: {
          accessKeyId:
            this.configService.get<string>("AWS_ACCESS_KEY_ID") || "test",
          secretAccessKey:
            this.configService.get<string>("AWS_SECRET_ACCESS_KEY") || "test",
        },
      }),
      handleMessage: async (message) => {
        try {
          const body = JSON.parse(message.Body!);
          const payload = (
            body.Message ? JSON.parse(body.Message) : body
          ) as PaymentConfirmedMessage;

          if (!payload.sessionId) {
            this.logger.error("Evento ignorado: sessionId ausente.");
            return;
          }

          this.logger.log(
            `Processando pagamento. SessionID: ${payload.sessionId}`
          );

          const cart = await this.cartGateway.getCartBySessionId(
            payload.sessionId
          );

          if (!cart) {
            this.logger.warn(
              `Carrinho vazio ou não encontrado. Pedido cancelado/ignorado.`
            );
            return;
          }

          const productionItems = cart.items.map((item) => ({
            sku: item.sku,
            quantity: item.quantity,
          }));

          const result = await this.receiveApprovedOrderUseCase.execute(
            payload.sessionId,
            productionItems
          );

          if (result.isFailure) {
            this.logger.error(
              `Falha no domínio ao criar pedido: ${result.error}`
            );
          } else {
            this.logger.log(
              `Pedido criado com sucesso na cozinha! Itens: ${productionItems.length}`
            );
          }
        } catch (error) {
          this.logger.error("Erro fatal no consumer:", error);
          throw error;
        }
      },
    });

    this.consumer.start();
  }

  onModuleDestroy() {
    if (this.consumer) this.consumer.stop();
  }
}
