import { Injectable, Inject, Logger } from "@nestjs/common";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { ConfigService } from "@nestjs/config";
import { IEventPublisher } from "@core/domain/events/i-event-publisher";

@Injectable()
export class SqsEventPublisher implements IEventPublisher {
  private readonly logger = new Logger(SqsEventPublisher.name);

  constructor(
    @Inject("SQS_CLIENT") private readonly sqsClient: SQSClient,
    private readonly configService: ConfigService
  ) {}

  async publish<T>(eventName: string, payload: T): Promise<void> {
    try {
      const queueUrl = this.getQueueUrl(eventName);

      if (!queueUrl) {
        this.logger.warn(
          `Nenhuma fila configurada para o evento: ${eventName}`
        );
        return;
      }

      const messageBody = JSON.stringify({
        pattern: eventName,
        data: payload,
        metadata: {
          timestamp: new Date().toISOString(),
          service: "order-service",
        },
      });

      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: messageBody,
      });

      await this.sqsClient.send(command);

      this.logger.log(`Evento [${eventName}] publicado com sucesso na fila.`);
    } catch (error) {
      this.logger.error(`Erro ao publicar evento [${eventName}]:`, error);
    }
  }

  private getQueueUrl(eventName: string): string | undefined {
    switch (eventName) {
      case "order.created":
        return this.configService.get<string>("SQS_ORDER_CREATED_URL");
      default:
        return undefined;
    }
  }
}
