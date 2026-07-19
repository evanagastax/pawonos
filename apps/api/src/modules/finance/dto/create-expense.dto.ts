import { IsString, IsNumber, IsOptional, IsDateString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateExpenseDto {
  @ApiProperty({ example: "category-id" })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: "Kitchen supplies", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: "2026-07-19" })
  @IsDateString()
  date: string;

  @ApiProperty({ example: "PURCHASE_ORDER", required: false })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiProperty({ example: "ref-id", required: false })
  @IsOptional()
  @IsString()
  referenceId?: string;
}