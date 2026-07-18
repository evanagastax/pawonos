import { IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRecipeVersionDto {
  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  yield?: number;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prepTime?: number;

  @ApiProperty({ example: 60, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cookTime?: number;

  @ApiProperty({ example: "Step by step instructions...", required: false })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ example: "Notes for this version", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}