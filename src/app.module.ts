import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "@infra/database/database.module";
import { MessagingModule } from "@infra/messaging/messaging.module";
import { ProductionModule } from "@infra/module/production.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MessagingModule,
    ProductionModule,
  ],
})
export class AppModule {}
