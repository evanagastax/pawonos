import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ForecastService } from "./forecast.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Forecast")
@Controller("forecast")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ForecastController {
  constructor(private readonly service: ForecastService) {}

  @Get("demand")
  @ApiOperation({ summary: "Forecast demand" })
  @ApiQuery({ name: "days", required: false })
  async forecastDemand(@Query("days") days?: number) {
    return this.service.forecastDemand(days ? Number(days) : 7);
  }

  @Get("ingredients")
  @ApiOperation({ summary: "Forecast ingredient needs" })
  @ApiQuery({ name: "days", required: false })
  async forecastIngredients(@Query("days") days?: number) {
    return this.service.forecastIngredients(days ? Number(days) : 7);
  }

  @Get("revenue")
  @ApiOperation({ summary: "Forecast revenue" })
  @ApiQuery({ name: "days", required: false })
  async forecastRevenue(@Query("days") days?: number) {
    return this.service.forecastRevenue(days ? Number(days) : 30);
  }

  @Get("menu-optimization")
  @ApiOperation({ summary: "Get menu optimization suggestions" })
  async suggestMenuOptimization() {
    return this.service.suggestMenuOptimization();
  }
}