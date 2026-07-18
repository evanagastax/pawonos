import { IsString, IsNumber, IsOptional, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePackagingDto {
  @ApiProperty({ example: "Premium Meal Box" })
  @IsString()
  name: string;

  @ApiProperty({ example: "PKG-001", required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: "unit-id" })
  @IsString()
  unitId: string;

  @ApiProperty({ example: 2500, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumStock?: number;

  @ApiProperty({ example: "High quality food-grade box", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}