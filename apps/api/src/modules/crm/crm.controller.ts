import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { CrmService } from "./crm.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("CRM")
@Controller("crm")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrmController {
  constructor(private readonly service: CrmService) {}

  @Get("customer/:id")
  @ApiOperation({ summary: "Get customer profile" })
  async getCustomerProfile(@Param("id") id: string) {
    return this.service.getCustomerProfile(id);
  }

  @Get("top-customers")
  @ApiOperation({ summary: "Get top customers" })
  @ApiQuery({ name: "limit", required: false })
  async getTopCustomers(@Query("limit") limit?: number) {
    return this.service.getTopCustomers(limit ? Number(limit) : 10);
  }

  @Get("inactive-customers")
  @ApiOperation({ summary: "Get inactive customers" })
  @ApiQuery({ name: "days", required: false })
  async getInactiveCustomers(@Query("days") days?: number) {
    return this.service.getInactiveCustomers(days ? Number(days) : 30);
  }

  @Get("segmentation")
  @ApiOperation({ summary: "Get customer segmentation" })
  async getCustomerSegmentation() {
    return this.service.getCustomerSegmentation();
  }
}