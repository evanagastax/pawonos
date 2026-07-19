import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Analytics")
@Controller("analytics")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Get analytics dashboard" })
  @ApiQuery({ name: "period", required: false })
  async getDashboard(@Query("period") period?: string) {
    return this.service.getDashboard(period);
  }

  @Get("top-menu-items")
  @ApiOperation({ summary: "Get top selling menu items" })
  @ApiQuery({ name: "limit", required: false })
  async getTopMenuItems(@Query("limit") limit?: number) {
    return this.service.getTopMenuItems(limit ? Number(limit) : 10);
  }

  @Get("ingredient-usage")
  @ApiOperation({ summary: "Get ingredient usage" })
  @ApiQuery({ name: "days", required: false })
  async getIngredientUsage(@Query("days") days?: number) {
    return this.service.getIngredientUsage(days ? Number(days) : 30);
  }

  @Get("profit-trend")
  @ApiOperation({ summary: "Get profit trend" })
  @ApiQuery({ name: "months", required: false })
  async getProfitTrend(@Query("months") months?: number) {
    return this.service.getProfitTrend(months ? Number(months) : 6);
  }
}