import { IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMealTemplateDto {
  @ApiProperty({ example: "Corporate Lunch" })
  @IsString()
  name: string;

  @ApiProperty({ example: "Standard corporate lunch package", required: false })
  @IsOptional()
  @IsString()
  description?: string;
}