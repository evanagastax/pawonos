import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { MealCalendarService } from "./meal-calendar.service";
import { CreateCalendarEntryDto } from "./dto/create-calendar-entry.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Meal Calendar")
@Controller("meal-calendar")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MealCalendarController {
  constructor(private readonly service: MealCalendarService) {}

  @Get()
  @ApiOperation({ summary: "Get calendar entries" })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async findAll(@Query("startDate") startDate?: string, @Query("endDate") endDate?: string, @Query("page") page?: number, @Query("pageSize") pageSize?: number) {
    return this.service.findAll({ startDate, endDate, page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50 });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get calendar entry by ID" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create calendar entry" })
  async create(@Body() dto: CreateCalendarEntryDto) {
    return this.service.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update calendar entry" })
  async update(@Param("id") id: string, @Body() dto: CreateCalendarEntryDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete calendar entry" })
  async remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}