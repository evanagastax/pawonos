import { IsString, IsNumber, IsOptional, Min, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderDto {
  @ApiProperty({ example: "customer-id" })
  @IsString()
  customerId: string;

  @ApiProperty({ example: "template-id" })
  @IsString()
  mealTemplateId: string;

  @ApiProperty({ example: 60 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: "2026-07-20" })
  @IsDateString()
  deliveryDate: string;

  @ApiProperty({ example: "11:00", required: false })
  @IsOptional()
  @IsString()
  deliveryTime?: string;

  @ApiProperty({ example: "Jl. Sudirman No. 123", required: false })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({ example: "No peanuts", required: false })
  @IsOptional()
  @IsString()
  specialNotes?: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiProperty({ example: 500000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deposit?: number;
}