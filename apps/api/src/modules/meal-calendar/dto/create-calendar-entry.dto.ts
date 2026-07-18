import { IsString, IsOptional, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCalendarEntryDto {
  @ApiProperty({ example: "2026-07-20" })
  @IsDateString()
  date: string;

  @ApiProperty({ example: "template-id" })
  @IsString()
  mealTemplateId: string;

  @ApiProperty({ example: "Special event", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}