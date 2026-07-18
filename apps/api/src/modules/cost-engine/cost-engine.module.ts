import { Module } from "@nestjs/common";
import { CostEngineService } from "./cost-engine.service";
import { CostEngineController } from "./cost-engine.controller";

@Module({
  controllers: [CostEngineController],
  providers: [CostEngineService],
  exports: [CostEngineService],
})
export class CostEngineModule {}