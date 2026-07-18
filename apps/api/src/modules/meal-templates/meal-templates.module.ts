import { Module } from "@nestjs/common";
import { MealTemplatesService } from "./meal-templates.service";
import { MealTemplatesController } from "./meal-templates.controller";

@Module({
  controllers: [MealTemplatesController],
  providers: [MealTemplatesService],
  exports: [MealTemplatesService],
})
export class MealTemplatesModule {}