import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { CostEngineService } from "./cost-engine.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Cost Engine")
@Controller("cost-engine")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CostEngineController {
  constructor(private readonly service: CostEngineService) {}

  @Get("standard-hpp/:recipeVersionId")
  @ApiOperation({ summary: "Calculate standard HPP" })
  async calculateStandardHpp(@Param("recipeVersionId") recipeVersionId: string) {
    return this.service.calculateStandardHpp(recipeVersionId);
  }

  @Get("actual-hpp/:productionBatchId")
  @ApiOperation({ summary: "Calculate actual HPP" })
  async calculateActualHpp(@Param("productionBatchId") productionBatchId: string) {
    return this.service.calculateActualHpp(productionBatchId);
  }

  @Get("selling-price")
  @ApiOperation({ summary: "Calculate suggested selling price" })
  @ApiQuery({ name: "hpp", required: true })
  @ApiQuery({ name: "targetMargin", required: true })
  async calculateSellingPrice(@Query("hpp") hpp: number, @Query("targetMargin") targetMargin: number) {
    return { suggestedPrice: await this.service.calculateSellingPrice(Number(hpp), Number(targetMargin)) };
  }

  @Get("max-hpp")
  @ApiOperation({ summary: "Calculate maximum allowable HPP" })
  @ApiQuery({ name: "budget", required: true })
  @ApiQuery({ name: "targetMargin", required: true })
  async calculateMaxHpp(@Query("budget") budget: number, @Query("targetMargin") targetMargin: number) {
    return { maxHpp: await this.service.calculateMaxHpp(Number(budget), Number(targetMargin)) };
  }

  @Get("analyze/:menuItemId")
  @ApiOperation({ summary: "Analyze pricing for menu item" })
  @ApiQuery({ name: "sellingPrice", required: true })
  async analyzePricing(@Param("menuItemId") menuItemId: string, @Query("sellingPrice") sellingPrice: number) {
    return this.service.analyzePricing(menuItemId, Number(sellingPrice));
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Get dashboard KPIs" })
  @ApiQuery({ name: "date", required: false })
  async getDashboardKpis(@Query("date") date?: string) {
    return this.service.getDashboardKpis(date);
  }

  @Post("optimize")
  @ApiOperation({ summary: "Optimize recipe for budget" })
  async optimizeForBudget(@Body() dto: { recipeVersionId: string; budget: number; targetMargin: number }) {
    return this.service.optimizeForBudget(dto.recipeVersionId, dto.budget, dto.targetMargin);
  }
}