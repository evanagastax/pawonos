import { IsString, IsOptional, IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCustomerDto {
  @ApiProperty({ example: "PT Maju Bersama" })
  @IsString()
  name: string;

  @ApiProperty({ example: "PT Maju Bersama", required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: "John Doe", required: false })
  @IsOptional()
  @IsString()
  picName?: string;

  @ApiProperty({ example: "john@majubersama.com", required: false })
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

  @ApiProperty({ example: "VIP customer", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}