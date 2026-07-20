import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { BranchesService } from "./branches.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Branches")
@Controller("branches")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  @Get()
  @ApiOperation({ summary: "Get all branches" })
  async findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get branch by ID" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/stats")
  @ApiOperation({ summary: "Get branch statistics" })
  async getStats(@Param("id") id: string) {
    return this.service.getStats(id);
  }
}