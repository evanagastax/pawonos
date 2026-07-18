import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { MealTemplatesService } from "./meal-templates.service";
import { CreateMealTemplateDto } from "./dto/create-meal-template.dto";
import { CreateMealTemplateItemDto } from "./dto/create-meal-template-item.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Meal Templates")
@Controller("meal-templates")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MealTemplatesController {
  constructor(private readonly service: MealTemplatesService) {}

  @Get()
  @ApiOperation({ summary: "Get all meal templates" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async findAll(@Query("search") search?: string, @Query("page") page?: number, @Query("pageSize") pageSize?: number) {
    return this.service.findAll({ search, page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50 });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get meal template by ID" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create meal template" })
  async create(@Body() dto: CreateMealTemplateDto) {
    return this.service.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update meal template" })
  async update(@Param("id") id: string, @Body() dto: CreateMealTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete meal template" })
  async remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post(":id/items")
  @ApiOperation({ summary: "Add menu item to template" })
  async addItem(@Param("id") id: string, @Body() dto: CreateMealTemplateItemDto) {
    return this.service.addItem(id, dto);
  }

  @Delete(":id/items/:itemId")
  @ApiOperation({ summary: "Remove menu item from template" })
  async removeItem(@Param("id") id: string, @Param("itemId") itemId: string) {
    return this.service.removeItem(id, itemId);
  }
}