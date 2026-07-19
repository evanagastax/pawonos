import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { EmployeesService } from "./employees.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Employees")
@Controller("employees")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: "Get all employees" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "department", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async findAll(@Query("search") search?: string, @Query("department") department?: string, @Query("page") page?: number, @Query("pageSize") pageSize?: number) {
    return this.service.findAll({ search, department, page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50 });
  }

  @Get("departments")
  @ApiOperation({ summary: "Get departments" })
  async getDepartments() {
    return this.service.getDepartments();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get employee by ID" })
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create employee" })
  async create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update employee" })
  async update(@Param("id") id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete employee" })
  async remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  // Attendance
  @Post(":id/attendance")
  @ApiOperation({ summary: "Record attendance" })
  async recordAttendance(@Param("id") id: string, @Body() dto: { date: string; status: string; checkIn?: string; checkOut?: string; notes?: string }) {
    return this.service.recordAttendance(id, dto.date, dto.status, dto.checkIn, dto.checkOut, dto.notes);
  }

  @Get(":id/attendance")
  @ApiOperation({ summary: "Get attendance" })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  async getAttendance(@Param("id") id: string, @Query("startDate") startDate?: string, @Query("endDate") endDate?: string) {
    return this.service.getAttendance(id, startDate, endDate);
  }
}