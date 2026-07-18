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
import { IngredientsService } from "./ingredients.service";
import { CreateIngredientDto } from "./dto/create-ingredient.dto";
import { UpdateIngredientDto } from "./dto/update-ingredient.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Ingredients")
@Controller("ingredients")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  @ApiOperation({ summary: "Get all ingredients" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "categoryId", required: false })
  @ApiQuery({ name: "supplierId", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiResponse({ status: 200, description: "List of ingredients" })
  async findAll(
    @Query("search") search?: string,
    @Query("categoryId") categoryId?: string,
    @Query("supplierId") supplierId?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ) {
    return this.ingredientsService.findAll({
      search,
      categoryId,
      supplierId,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }

  @Get("categories")
  @ApiOperation({ summary: "Get all ingredient categories" })
  @ApiResponse({ status: 200, description: "List of categories" })
  async getCategories() {
    return this.ingredientsService.getCategories();
  }

  @Get("units")
  @ApiOperation({ summary: "Get all units" })
  @ApiResponse({ status: 200, description: "List of units" })
  async getUnits() {
    return this.ingredientsService.getUnits();
  }

  @Get("low-stock")
  @ApiOperation({ summary: "Get ingredients with low stock" })
  @ApiResponse({ status: 200, description: "List of low stock ingredients" })
  async getLowStock() {
    return this.ingredientsService.getLowStock();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get ingredient by ID" })
  @ApiResponse({ status: 200, description: "Ingredient details" })
  @ApiResponse({ status: 404, description: "Ingredient not found" })
  async findOne(@Param("id") id: string) {
    return this.ingredientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create new ingredient" })
  @ApiResponse({ status: 201, description: "Ingredient created" })
  @ApiResponse({ status: 409, description: "SKU already exists" })
  async create(@Body() dto: CreateIngredientDto) {
    return this.ingredientsService.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update ingredient" })
  @ApiResponse({ status: 200, description: "Ingredient updated" })
  @ApiResponse({ status: 404, description: "Ingredient not found" })
  async update(@Param("id") id: string, @Body() dto: UpdateIngredientDto) {
    return this.ingredientsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete ingredient (soft delete)" })
  @ApiResponse({ status: 200, description: "Ingredient deleted" })
  @ApiResponse({ status: 404, description: "Ingredient not found" })
  async remove(@Param("id") id: string) {
    return this.ingredientsService.remove(id);
  }
}