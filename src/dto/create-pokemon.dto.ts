import { IsNumber, IsString, IsArray, IsOptional, IsObject } from 'class-validator';

export class CreatePokemonDto {
  @IsNumber()
  id: number;

  @IsString()
  num: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  img?: string;

  @IsArray()
  @IsString({ each: true })
  type: string[];

  @IsString()
  @IsOptional()
  height?: string;

  @IsString()
  @IsOptional()
  weight?: string;

  @IsString()
  @IsOptional()
  candy?: string;

  @IsString()
  @IsOptional()
  egg?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  multipliers?: number[] | null;

  @IsArray()
  @IsString({ each: true })
  weaknesses: string[];

  @IsNumber()
  spawn_chance: number;

  @IsNumber()
  avg_spawns: number;

  @IsString()
  spawn_time: string;

  @IsArray()
  @IsObject({ each: true })
  @IsOptional()
  prev_evolution?: { num: string; name: string }[];
} 