import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Invoices")
@Controller("invoices")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: "Get all invoices" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "orderId", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async findAll(
    @Query("status") status?: string,
    @Query("orderId") orderId?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ) {
    return this.service.findAll({
      status,
      orderId,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }

  @Get("summary")
  @ApiOperation({ summary: "Get invoice summary" })
  async getSummary() {
    return this.service.getSummary();
  }

  @Get("overdue")
  @ApiOperation({ summary: "Get overdue invoices" })
  async getOverdue() {
    return this.service.getOverdue();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get invoice by ID" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create invoice for order" })
  async create(@Body() dto: { orderId: string; dueDate: string; notes?: string }) {
    return this.service.create(dto.orderId, dto.dueDate, dto.notes);
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update invoice status" })
  async updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.service.updateStatus(id, status);
  }

  @Post(":id/payment")
  @ApiOperation({ summary: "Record payment for invoice" })
  async recordPayment(
    @Param("id") id: string,
    @Body() dto: { amount: number; paymentMethod: string; reference?: string },
  ) {
    return this.service.recordPayment(id, dto.amount, dto.paymentMethod, dto.reference);
  }
}