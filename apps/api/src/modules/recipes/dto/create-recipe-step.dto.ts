import { IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRecipeStepDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  stepNumber: number;

  @ApiProperty({ example: "Marinate chicken with spices for 30 minutes" })
  @IsString()
  instruction: string;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({ example: "Use fresh turmeric for better color", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}