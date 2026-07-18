import { IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRecipeItemDto {
  @ApiProperty({ example: "ingredient-id", required: false })
  @IsOptional()
  @IsString()
  ingredientId?: string;

  @ApiProperty({ example: "packaging-id", required: false })
  @IsOptional()
  @IsString()
  packagingId?: string;

  @ApiProperty({ example: 0.25 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: "unit-id" })
  @IsString()
  unitId: string;

  @ApiProperty({ example: "Cut into small pieces", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}