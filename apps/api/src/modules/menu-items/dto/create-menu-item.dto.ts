import { IsString, IsNumber, IsOptional, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMenuItemDto {
  @ApiProperty({ example: "Ayam Betutu" })
  @IsString()
  name: string;

  @ApiProperty({ example: "Balinese spiced chicken", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: "recipe-id" })
  @IsString()
  recipeId: string;

  @ApiProperty({ example: "version-id" })
  @IsString()
  recipeVersionId: string;

  @ApiProperty({ example: 25000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;
}