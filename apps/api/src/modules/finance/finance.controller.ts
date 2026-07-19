import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { FinanceService } from "./finance.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Finance")
@Controller("finance")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  // Categories
  @Get("categories")
  @ApiOperation({ summary: "Get expense categories" })
  async getCategories() {
    return this.service.getCategories();
  }

  @Post("categories")
  @ApiOperation({ summary: "Create expense category" })
  async createCategory(@Body("name") name: string) {
    return this.service.createCategory(name);
  }

  @Delete("categories/:id")
  @ApiOperation({ summary: "Delete expense category" })
  async deleteCategory(@Param("id") id: string) {
    return this.service.deleteCategory(id);
  }

  // Expenses
  @Get("expenses")
  @ApiOperation({ summary: "Get expenses" })
  @ApiQuery({ name: "categoryId", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async getExpenses(
    @Query("categoryId") categoryId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ) {
    return this.service.getExpenses({
      categoryId,
      startDate,
      endDate,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }

  @Get("expenses/:id")
  @ApiOperation({ summary: "Get expense by ID" })
  async getExpense(@Param("id") id: string) {
    return this.service.getExpense(id);
  }

  @Post("expenses")
  @ApiOperation({ summary: "Create expense" })
  async createExpense(@Body() dto: CreateExpenseDto) {
    return this.service.createExpense(dto);
  }

  @Put("expenses/:id")
  @ApiOperation({ summary: "Update expense" })
  async updateExpense(@Param("id") id: string, @Body() dto: UpdateExpenseDto) {
    return this.service.updateExpense(id, dto);
  }

  @Delete("expenses/:id")
  @ApiOperation({ summary: "Delete expense" })
  async deleteExpense(@Param("id") id: string) {
    return this.service.deleteExpense(id);
  }

  // Reports
  @Get("cash-flow")
  @ApiOperation({ summary: "Get cash flow report" })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  async getCashFlow(@Query("startDate") startDate?: string, @Query("endDate") endDate?: string) {
    return this.service.getCashFlow({ startDate, endDate });
  }

  @Get("profit-loss")
  @ApiOperation({ summary: "Get profit & loss report" })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  async getProfitLoss(@Query("startDate") startDate?: string, @Query("endDate") endDate?: string) {
    return this.service.getProfitLoss({ startDate, endDate });
  }
}