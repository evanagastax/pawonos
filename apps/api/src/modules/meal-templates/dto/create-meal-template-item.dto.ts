import { IsString, IsNumber, IsOptional, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMealTemplateItemDto {
  @ApiProperty({ example: "menu-item-id" })
  @IsString()
  menuItemId: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({ example: "Extra spicy", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}