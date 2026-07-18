import { IsString, IsNumber, IsOptional, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateIngredientDto {
  @ApiProperty({ example: "Chicken Breast" })
  @IsString()
  name: string;

  @ApiProperty({ example: "CHK-001", required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: "category-id" })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: "unit-id" })
  @IsString()
  unitId: string;

  @ApiProperty({ example: 45000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumStock?: number;

  @ApiProperty({ example: "Fresh chicken breast", required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: "supplier-id", required: false })
  @IsOptional()
  @IsString()
  supplierId?: string;
}