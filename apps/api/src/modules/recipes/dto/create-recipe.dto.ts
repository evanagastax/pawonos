import { IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRecipeDto {
  @ApiProperty({ example: "Ayam Betutu" })
  @IsString()
  name: string;

  @ApiProperty({ example: "Balinese spiced chicken", required: false })
  @IsOptional()
  @IsString()
  description?: string;
}