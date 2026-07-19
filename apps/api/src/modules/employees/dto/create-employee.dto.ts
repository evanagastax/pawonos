import { IsString, IsNumber, IsOptional, IsEmail, IsDateString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateEmployeeDto {
  @ApiProperty({ example: "EMP001" })
  @IsString()
  employeeCode: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  name: string;

  @ApiProperty({ example: "john@pawonos.com", required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "08123456789", required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: "Jl. Sudirman No. 123", required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: "Head Chef" })
  @IsString()
  position: string;

  @ApiProperty({ example: "Kitchen", required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: "2026-01-15" })
  @IsDateString()
  joinDate: string;

  @ApiProperty({ example: 5000000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @ApiProperty({ example: "BCA", required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ example: "1234567890", required: false })
  @IsOptional()
  @IsString()
  bankAccount?: string;
}