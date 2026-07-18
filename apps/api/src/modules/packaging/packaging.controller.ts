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
import { PackagingService } from "./packaging.service";
import { CreatePackagingDto } from "./dto/create-packaging.dto";
import { UpdatePackagingDto } from "./dto/update-packaging.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Packaging")
@Controller("packaging")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PackagingController {
  constructor(private readonly packagingService: PackagingService) {}

  @Get()
  @ApiOperation({ summary: "Get all packaging items" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiResponse({ status: 200, description: "List of packaging items" })
  async findAll(
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ) {
    return this.packagingService.findAll({
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }

  @Get("low-stock")
  @ApiOperation({ summary: "Get packaging items with low stock" })
  @ApiResponse({ status: 200, description: "List of low stock packaging" })
  async getLowStock() {
    return this.packagingService.getLowStock();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get packaging by ID" })
  @ApiResponse({ status: 200, description: "Packaging details" })
  @ApiResponse({ status: 404, description: "Packaging not found" })
  async findOne(@Param("id") id: string) {
    return this.packagingService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create new packaging item" })
  @ApiResponse({ status: 201, description: "Packaging created" })
  @ApiResponse({ status: 409, description: "SKU already exists" })
  async create(@Body() dto: CreatePackagingDto) {
    return this.packagingService.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update packaging item" })
  @ApiResponse({ status: 200, description: "Packaging updated" })
  @ApiResponse({ status: 404, description: "Packaging not found" })
  async update(@Param("id") id: string, @Body() dto: UpdatePackagingDto) {
    return this.packagingService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete packaging item (soft delete)" })
  @ApiResponse({ status: 200, description: "Packaging deleted" })
  @ApiResponse({ status: 404, description: "Packaging not found" })
  async remove(@Param("id") id: string) {
    return this.packagingService.remove(id);
  }
}