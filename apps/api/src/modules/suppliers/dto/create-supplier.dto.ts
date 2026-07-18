import { IsString, IsOptional, IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSupplierDto {
  @ApiProperty({ example: "PT Food Supply Indonesia" })
  @IsString()
  name: string;

  @ApiProperty({ example: "John Doe", required: false })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiProperty({ example: "john@foodsupply.com", required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "08123456789", required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: "Jl. Sudirman No. 123, Jakarta", required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: "Main supplier for meat", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}