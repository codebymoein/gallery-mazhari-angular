import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Min,
} from 'class-validator';
import { CeremonyType } from '../planner-task-catalog';

export class UpsertPlannerDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  eventDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsEnum(CeremonyType, { each: true })
  ceremonyTypes: CeremonyType[];

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class UpdatePlannerTaskDto {
  @IsBoolean()
  completed: boolean;

  @IsInt()
  @Min(1)
  version: number;
}

export class DeletePlannerDto {
  @IsInt()
  @Min(1)
  version: number;
}
