import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsNumberString()
  PORT: string;

  /** postgres (پیش‌فرض) یا sqlite برای توسعه محلی */
  @IsOptional()
  @IsEnum(['postgres', 'sqlite'])
  DB_TYPE: 'postgres' | 'sqlite';

  @IsOptional()
  @IsString()
  DB_HOST: string;

  @IsOptional()
  @IsNumberString()
  DB_PORT: string;

  @IsOptional()
  @IsString()
  DB_USERNAME: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD: string;

  @IsOptional()
  @IsString()
  DB_NAME: string;

  @IsString()
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN: string;

  @IsOptional()
  @IsString()
  ADMIN_SETUP_KEY: string;

  @IsOptional()
  @IsEnum(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test';
}

export default EnvironmentVariables;
