import { Module, Global } from "@nestjs/common";
import { SQSClient } from "@aws-sdk/client-sqs";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SqsEventPublisher } from "./producers/sqs-event-publisher";
import { HttpModule } from "@nestjs/axios";
import { CartGateway } from "@infra/gayteways/cart.gateway";

@Global()
@Module({
  imports: [ConfigModule, HttpModule],
  providers: [
    {
      provide: "SQS_CLIENT",
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new SQSClient({
          region: configService.get("AWS_REGION"),
          endpoint: configService.get("SQS_ENDPOINT"),
          credentials: {
            accessKeyId: configService.get("AWS_ACCESS_KEY_ID") || "test",
            secretAccessKey:
              configService.get("AWS_SECRET_ACCESS_KEY") || "test",
          },
        });
      },
    },
    {
      provide: "IEventPublisher",
      useClass: SqsEventPublisher,
    },
    SqsEventPublisher,
    CartGateway,
  ],
  exports: ["IEventPublisher", "SQS_CLIENT", CartGateway],
})
export class MessagingModule {}
