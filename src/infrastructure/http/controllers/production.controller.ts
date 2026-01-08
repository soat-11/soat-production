import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Res,
  HttpStatus,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Response } from "express";
import { IsEnum, IsNotEmpty } from "class-validator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiProperty,
} from "@nestjs/swagger";

import { ListProductionOrdersUseCase } from "@core/use-cases/list-production-orders.use-case";
import { UpdateProductionStatusUseCase } from "@core/use-cases/update-production-status.use-case";
import { ProductionStatus } from "@domain/enum/production-status.enum";

class UpdateStatusDto {
  @ApiProperty({
    description: "Novo status do pedido na cozinha",
    enum: ProductionStatus,
    example: ProductionStatus.IN_PREPARATION,
  })
  @IsNotEmpty()
  @IsEnum(ProductionStatus, {
    message:
      "Status inválido. Valores permitidos: IN_PREPARATION, READY, COMPLETED",
  })
  status: ProductionStatus;
}

@ApiTags("Production")
@Controller("production")
export class ProductionController {
  private readonly logger = new Logger(ProductionController.name);

  constructor(
    private readonly listUseCase: ListProductionOrdersUseCase,
    private readonly updateUseCase: UpdateProductionStatusUseCase
  ) {}

  @Get()
  @ApiOperation({
    summary: "Listar fila de pedidos",
    description:
      "Retorna todos os pedidos ativos na cozinha (que não foram finalizados/retirados), ordenados por chegada.",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de pedidos recuperada com sucesso.",
    schema: {
      example: [
        {
          sessionId: "sessao-teste-001",
          items: [{ sku: "X-BURGER", quantity: 1 }],
          status: "RECEIVED",
          createdAt: "2026-01-08T10:00:00.000Z",
        },
      ],
    },
  })
  @ApiResponse({ status: 500, description: "Erro interno do servidor." })
  async list(@Res() res: Response) {
    this.logger.log("Listando pedidos ativos na cozinha...");
    const result = await this.listUseCase.execute();

    if (result.isFailure) {
      throw new InternalServerErrorException(result.error);
    }

    return res.status(HttpStatus.OK).json(result.getValue());
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Atualizar status do pedido",
    description:
      "Move o pedido para o próximo estágio (ex: De Recebido para Em Preparação).",
  })
  @ApiParam({
    name: "id",
    description: "ID da Sessão (sessionId) ou ID interno do pedido",
    example: "sessao-teste-001",
  })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({
    status: 200,
    description:
      "Status atualizado com sucesso. Evento de integração disparado.",
  })
  @ApiResponse({
    status: 400,
    description:
      "Erro de validação (Status inválido) ou Regra de Negócio (Pular etapa proibida).",
    schema: {
      example: {
        statusCode: 400,
        timestamp: "2026-01-08T...",
        path: "/production/...",
        error: "O pedido precisa estar EM PREPARAÇÃO para ficar PRONTO.",
      },
    },
  })
  async updateStatus(
    @Param("id") sessionId: string,
    @Body() body: UpdateStatusDto,
    @Res() res: Response
  ) {
    this.logger.log(
      `Atualizando status do pedido ${sessionId} para ${body.status}`
    );

    const result = await this.updateUseCase.execute(sessionId, body.status);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return res
      .status(HttpStatus.OK)
      .json({ message: "Status atualizado com sucesso" });
  }
}
