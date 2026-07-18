import { Module } from "@nestjs/common";
import { MealCalendarService } from "./meal-calendar.service";
import { MealCalendarController } from "./meal-calendar.controller";

@Module({
  controllers: [MealCalendarController],
  providers: [MealCalendarService],
  exports: [MealCalendarService],
})
export class MealCalendarModule {}