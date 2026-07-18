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
import { RecipesService } from "./recipes.service";
import { CreateRecipeDto } from "./dto/create-recipe.dto";
import { CreateRecipeVersionDto } from "./dto/create-recipe-version.dto";
import { CreateRecipeItemDto } from "./dto/create-recipe-item.dto";
import { CreateRecipeStepDto } from "./dto/create-recipe-step.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Recipes")
@Controller("recipes")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  // ============================================
  // RECIPE CRUD
  // ============================================

  @Get()
  @ApiOperation({ summary: "Get all recipes" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiResponse({ status: 200, description: "List of recipes" })
  async findAll(
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ) {
    return this.recipesService.findAll({
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get recipe by ID" })
  @ApiResponse({ status: 200, description: "Recipe details" })
  @ApiResponse({ status: 404, description: "Recipe not found" })
  async findOne(@Param("id") id: string) {
    return this.recipesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create new recipe" })
  @ApiResponse({ status: 201, description: "Recipe created" })
  async create(@Body() dto: CreateRecipeDto) {
    return this.recipesService.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update recipe" })
  @ApiResponse({ status: 200, description: "Recipe updated" })
  @ApiResponse({ status: 404, description: "Recipe not found" })
  async update(@Param("id") id: string, @Body() dto: CreateRecipeDto) {
    return this.recipesService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete recipe" })
  @ApiResponse({ status: 200, description: "Recipe deleted" })
  @ApiResponse({ status: 404, description: "Recipe not found" })
  async remove(@Param("id") id: string) {
    return this.recipesService.remove(id);
  }

  // ============================================
  // RECIPE VERSIONS
  // ============================================

  @Get(":id/versions")
  @ApiOperation({ summary: "Get all versions of a recipe" })
  @ApiResponse({ status: 200, description: "List of versions" })
  async getVersions(@Param("id") id: string) {
    return this.recipesService.getVersions(id);
  }

  @Get(":id/versions/:versionId")
  @ApiOperation({ summary: "Get specific version" })
  @ApiResponse({ status: 200, description: "Version details" })
  @ApiResponse({ status: 404, description: "Version not found" })
  async getVersion(@Param("id") id: string, @Param("versionId") versionId: string) {
    return this.recipesService.getVersion(id, versionId);
  }

  @Post(":id/versions")
  @ApiOperation({ summary: "Create new version" })
  @ApiResponse({ status: 201, description: "Version created" })
  async createVersion(@Param("id") id: string, @Body() dto: CreateRecipeVersionDto) {
    return this.recipesService.createVersion(id, dto);
  }

  // ============================================
  // RECIPE ITEMS
  // ============================================

  @Post(":id/versions/:versionId/items")
  @ApiOperation({ summary: "Add ingredient to recipe" })
  @ApiResponse({ status: 201, description: "Item added" })
  async addItem(
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Body() dto: CreateRecipeItemDto,
  ) {
    return this.recipesService.addItem(id, versionId, dto);
  }

  @Put(":id/versions/:versionId/items/:itemId")
  @ApiOperation({ summary: "Update recipe item" })
  @ApiResponse({ status: 200, description: "Item updated" })
  async updateItem(
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Param("itemId") itemId: string,
    @Body() dto: CreateRecipeItemDto,
  ) {
    return this.recipesService.updateItem(id, versionId, itemId, dto);
  }

  @Delete(":id/versions/:versionId/items/:itemId")
  @ApiOperation({ summary: "Remove recipe item" })
  @ApiResponse({ status: 200, description: "Item removed" })
  async removeItem(
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Param("itemId") itemId: string,
  ) {
    return this.recipesService.removeItem(id, versionId, itemId);
  }

  // ============================================
  // RECIPE STEPS
  // ============================================

  @Post(":id/versions/:versionId/steps")
  @ApiOperation({ summary: "Add step to recipe" })
  @ApiResponse({ status: 201, description: "Step added" })
  async addStep(
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Body() dto: CreateRecipeStepDto,
  ) {
    return this.recipesService.addStep(id, versionId, dto);
  }

  @Put(":id/versions/:versionId/steps/:stepId")
  @ApiOperation({ summary: "Update recipe step" })
  @ApiResponse({ status: 200, description: "Step updated" })
  async updateStep(
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Param("stepId") stepId: string,
    @Body() dto: CreateRecipeStepDto,
  ) {
    return this.recipesService.updateStep(id, versionId, stepId, dto);
  }

  @Delete(":id/versions/:versionId/steps/:stepId")
  @ApiOperation({ summary: "Remove recipe step" })
  @ApiResponse({ status: 200, description: "Step removed" })
  async removeStep(
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Param("stepId") stepId: string,
  ) {
    return this.recipesService.removeStep(id, versionId, stepId);
  }

  // ============================================
  // COST CALCULATION
  // ============================================

  @Post(":id/versions/:versionId/calculate-cost")
  @ApiOperation({ summary: "Calculate recipe cost" })
  @ApiResponse({ status: 200, description: "Cost breakdown" })
  async calculateCost(
    @Param("id") id: string,
    @Param("versionId") versionId: string,
  ) {
    return this.recipesService.calculateVersionCost(id, versionId);
  }

  // ============================================
  // INGREDIENT ALTERNATIVES
  // ============================================

  @Get("ingredients/:ingredientId/alternatives")
  @ApiOperation({ summary: "Get ingredient alternatives" })
  @ApiResponse({ status: 200, description: "List of alternatives" })
  async getAlternatives(@Param("ingredientId") ingredientId: string) {
    return this.recipesService.getAlternatives(ingredientId);
  }

  @Post("ingredients/:ingredientId/alternatives")
  @ApiOperation({ summary: "Add ingredient alternative" })
  @ApiResponse({ status: 201, description: "Alternative added" })
  async addAlternative(
    @Param("ingredientId") ingredientId: string,
    @Body() dto: { alternativeId: string; conversionRate?: number; costDifference?: number; qualityRating?: number; notes?: string },
  ) {
    return this.recipesService.addAlternative(ingredientId, dto.alternativeId, dto);
  }

  @Delete("ingredients/:ingredientId/alternatives/:alternativeId")
  @ApiOperation({ summary: "Remove ingredient alternative" })
  @ApiResponse({ status: 200, description: "Alternative removed" })
  async removeAlternative(
    @Param("ingredientId") ingredientId: string,
    @Param("alternativeId") alternativeId: string,
  ) {
    return this.recipesService.removeAlternative(ingredientId, alternativeId);
  }
}