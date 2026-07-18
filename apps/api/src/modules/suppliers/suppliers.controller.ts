import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SuppliersService } from "./suppliers.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Suppliers")
@Controller("suppliers")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: "Get all suppliers" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiResponse({ status: 200, description: "List of suppliers" })
  async findAll(
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ) {
    return this.suppliersService.findAll({
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get supplier by ID" })
  @ApiResponse({ status: 200, description: "Supplier details" })
  @ApiResponse({ status: 404, description: "Supplier not found" })
  async findOne(@Param("id") id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create new supplier" })
  @ApiResponse({ status: 201, description: "Supplier created" })
  async create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update supplier" })
  @ApiResponse({ status: 200, description: "Supplier updated" })
  @ApiResponse({ status: 404, description: "Supplier not found" })
  async update(@Param("id") id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete supplier (soft delete)" })
  @ApiResponse({ status: 200, description: "Supplier deleted" })
  @ApiResponse({ status: 404, description: "Supplier not found" })
  async remove(@Param("id") id: string) {
    return this.suppliersService.remove(id);
  }
}